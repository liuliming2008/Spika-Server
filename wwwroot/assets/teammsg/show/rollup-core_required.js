(function(c, d) {
    var b = null;

    function a(aZ, ai) {
        this.setupOptions = {
            url: (aZ || null),
            flashVersion: 8,
            debugMode: true,
            debugFlash: false,
            useConsole: true,
            consoleOnly: true,
            waitForWindowLoad: false,
            bgColor: "#ffffff",
            useHighPerformance: false,
            flashPollingInterval: null,
            html5PollingInterval: null,
            flashLoadTimeout: 1000,
            wmode: null,
            allowScriptAccess: "always",
            useFlashBlock: false,
            useHTML5Audio: true,
            html5Test: /^(probably|maybe)$/i,
            preferFlash: true,
            noSWFCache: false,
            idPrefix: "sound"
        };
        this.defaultOptions = {
            autoLoad: false,
            autoPlay: false,
            from: null,
            loops: 1,
            onid3: null,
            onload: null,
            whileloading: null,
            onplay: null,
            onpause: null,
            onresume: null,
            whileplaying: null,
            onposition: null,
            onstop: null,
            onfailure: null,
            onfinish: null,
            multiShot: true,
            multiShotEvents: false,
            position: null,
            pan: 0,
            stream: true,
            to: null,
            type: null,
            usePolicyFile: false,
            volume: 100
        };
        this.flash9Options = {
            isMovieStar: null,
            usePeakData: false,
            useWaveformData: false,
            useEQData: false,
            onbufferchange: null,
            ondataerror: null
        };
        this.movieStarOptions = {
            bufferTime: 3,
            serverURL: null,
            onconnect: null,
            duration: null
        };
        this.audioFormats = {
            mp3: {
                type: ['audio/mpeg; codecs="mp3"', "audio/mpeg", "audio/mp3", "audio/MPA", "audio/mpa-robust"],
                required: true
            },
            mp4: {
                related: ["aac", "m4a", "m4b"],
                type: ['audio/mp4; codecs="mp4a.40.2"', "audio/aac", "audio/x-m4a", "audio/MP4A-LATM", "audio/mpeg4-generic"],
                required: false
            },
            ogg: {
                type: ["audio/ogg; codecs=vorbis"],
                required: false
            },
            opus: {
                type: ["audio/ogg; codecs=opus", "audio/opus"],
                required: false
            },
            wav: {
                type: ['audio/wav; codecs="1"', "audio/wav", "audio/wave", "audio/x-wav"],
                required: false
            }
        };
        this.movieID = "sm2-container";
        this.id = (ai || "sm2movie");
        this.debugID = "soundmanager-debug";
        this.debugURLParam = /([#?&])debug=1/i;
        this.versionNumber = "V2.97a.20130512";
        this.version = null;
        this.movieURL = null;
        this.altURL = null;
        this.swfLoaded = false;
        this.enabled = false;
        this.oMC = null;
        this.sounds = {};
        this.soundIDs = [];
        this.muted = false;
        this.didFlashBlock = false;
        this.filePattern = null;
        this.filePatterns = {
            flash8: /\.mp3(\?.*)?$/i,
            flash9: /\.mp3(\?.*)?$/i
        };
        this.features = {
            buffering: false,
            peakData: false,
            waveformData: false,
            eqData: false,
            movieStar: false
        };
        this.sandbox = {
            type: null,
            types: {
                remote: "remote (domain-based) rules",
                localWithFile: "local with file access (no internet access)",
                localWithNetwork: "local with network (internet access only, no local access)",
                localTrusted: "local, trusted (local+internet access)"
            },
            description: null,
            noRemote: null,
            noLocal: null
        };
        this.html5 = {
            usingFlash: null
        };
        this.flash = {};
        this.html5Only = false;
        this.ignoreFlash = false;
        var ak, ao = this,
            a7 = null,
            ad = null,
            aW = "soundManager",
            G = aW + ": ",
            a3 = "HTML5::",
            an, au = navigator.userAgent,
            y = c.location.href.toString(),
            aa = document,
            U, A, aJ, bg, w = [],
            bf = true,
            N, ap = false,
            aT = false,
            ax = false,
            a0 = false,
            ba = false,
            W, aw = 0,
            x, a1, a5, a2, Z, aR, t, z, bb, aU, u, e, k, aD, M, bi, q, be, I, ab, m, E, aH = ["log", "info", "warn", "error"],
            Y = 8,
            X, s, az, aK = null,
            aj = null,
            bd, aA, n, F, aC, B, p, ar, J, aQ = false,
            aI = false,
            aO, O, ae, L = 0,
            bc = null,
            ac, aq = [],
            af, C = null,
            T, a9, am, aL, g, P, aN, al, S = Array.prototype.slice,
            aY = false,
            l, at, R, D, i, aF, Q, aE, ag = 0,
            aV = au.match(/(ipad|iphone|ipod)/i),
            av = au.match(/android/i),
            a6 = au.match(/msie/i),
            aG = au.match(/webkit/i),
            aX = (au.match(/safari/i) && !au.match(/chrome/i)),
            v = (au.match(/opera/i)),
            j = (au.match(/firefox/i)),
            aS = (au.match(/(mobile|pre\/|xoom)/i) || aV || av),
            a4 = (!y.match(/usehtml5audio/i) && !y.match(/sm2\-ignorebadua/i) && aX && !au.match(/silk/i) && au.match(/OS X 10_6_([3-7])/i)),
            K = (c.console !== d && console.log !== d),
            aB = (aa.hasFocus !== d ? aa.hasFocus() : null),
            a8 = (aX && (aa.hasFocus === d || !aa.hasFocus())),
            ay = !a8,
            r = /(mp3|mp4|mpa|m4a|m4b)/i,
            h = 1000,
            o = "about:blank",
            H = (aa.location ? aa.location.protocol.match(/http/i) : null),
            aM = (!H ? "http://" : ""),
            f = /^\s*audio\/(?:x-)?(?:mpeg4|aac|flv|mov|mp4||m4v|m4a|m4b|mp4v|3gp|3g2)\s*(?:$|;)/i,
            V = ["mpeg4", "aac", "flv", "mov", "mp4", "m4v", "f4v", "m4a", "m4b", "mp4v", "3gp", "3g2"],
            ah = new RegExp("\\.(" + V.join("|") + ")(\\?.*)?$", "i");
        this.mimePattern = /^\s*audio\/(?:x-)?(?:mp(?:eg|3))\s*(?:$|;)/i;
        this.useAltURL = !H;
        F = {
            swfBox: "sm2-object-box",
            swfDefault: "movieContainer",
            swfError: "swf_error",
            swfTimedout: "swf_timedout",
            swfLoaded: "swf_loaded",
            swfUnblocked: "swf_unblocked",
            sm2Debug: "sm2_debug",
            highPerf: "high_performance",
            flashDebug: "flash_debug"
        };
        this.hasHTML5 = (function() {
            try {
                return (Audio !== d && (v && opera !== d && opera.version() < 10 ? new Audio(null) : new Audio()).canPlayType !== d)
            } catch (bj) {
                return false
            }
        }());
        this.setup = function(bj) {
            var bk = (!ao.url);
            if (bj !== d && ax && C && ao.ok() && (bj.flashVersion !== d || bj.url !== d || bj.html5Test !== d)) {
                ar(bd("setupLate"))
            }
            a5(bj);
            if (bj) {
                if (bk && q && bj.url !== d) {
                    ao.beginDelayedInit()
                }
                if (!q && bj.url !== d && aa.readyState === "complete") {
                    setTimeout(M, 1)
                }
            }
            return ao
        };
        this.ok = function() {
            return (C ? (ax && !a0) : (ao.useHTML5Audio && ao.hasHTML5))
        };
        this.supported = this.ok;
        this.getMovie = function(bj) {
            return an(bj) || aa[bj] || c[bj]
        };
        this.createSound = function(bl, bn) {
            var bo, bp, bk, bm = null;
            bo = aW + ".createSound(): ";
            bp = bo + bd(!ax ? "notReady" : "notOK");
            if (!ax || !ao.ok()) {
                ar(bp);
                return false
            }
            if (bn !== d) {
                bl = {
                    id: bl,
                    url: bn
                }
            }
            bk = a1(bl);
            bk.url = ac(bk.url);
            if (bk.id === undefined) {
                bk.id = ao.setupOptions.idPrefix + (ag++)
            }
            if (bk.id.toString().charAt(0).match(/^[0-9]$/)) {
                ao._wD(bo + bd("badID", bk.id), 2)
            }
            ao._wD(bo + bk.id + (bk.url ? " (" + bk.url + ")" : ""), 1);
            if (J(bk.id, true)) {
                ao._wD(bo + bk.id + " exists", 1);
                return ao.sounds[bk.id]
            }

            function bj() {
                bk = B(bk);
                ao.sounds[bk.id] = new ak(bk);
                ao.soundIDs.push(bk.id);
                return ao.sounds[bk.id]
            }
            if (a9(bk)) {
                bm = bj();
                ao._wD(bk.id + ": Using HTML5");
                bm._setup_html5(bk)
            } else {
                if (ao.html5Only) {
                    ao._wD(bk.id + ": No HTML5 support for this sound, and no Flash. Exiting.");
                    return bj()
                }
                if (ao.html5.usingFlash && bk.url && bk.url.match(/data\:/i)) {
                    ao._wD(bk.id + ": data: URIs not supported via Flash. Exiting.");
                    return bj()
                }
                if (bg > 8) {
                    if (bk.isMovieStar === null) {
                        bk.isMovieStar = !!(bk.serverURL || (bk.type ? bk.type.match(f) : false) || (bk.url && bk.url.match(ah)))
                    }
                    if (bk.isMovieStar) {
                        ao._wD(bo + "using MovieStar handling");
                        if (bk.loops > 1) {
                            W("noNSLoop")
                        }
                    }
                }
                bk = p(bk, bo);
                bm = bj();
                if (bg === 8) {
                    ad._createSound(bk.id, bk.loops || 1, bk.usePolicyFile)
                } else {
                    ad._createSound(bk.id, bk.url, bk.usePeakData, bk.useWaveformData, bk.useEQData, bk.isMovieStar, (bk.isMovieStar ? bk.bufferTime : false), bk.loops || 1, bk.serverURL, bk.duration || null, bk.autoPlay, true, bk.autoLoad, bk.usePolicyFile);
                    if (!bk.serverURL) {
                        bm.connected = true;
                        if (bk.onconnect) {
                            bk.onconnect.apply(bm)
                        }
                    }
                }
                if (!bk.serverURL && (bk.autoLoad || bk.autoPlay)) {
                    bm.load(bk)
                }
            }
            if (!bk.serverURL && bk.autoPlay) {
                bm.play()
            }
            return bm
        };
        this.destroySound = function(bj, bm) {
            if (!J(bj)) {
                return false
            }
            var bl = ao.sounds[bj],
                bk;
            bl._iO = {};
            bl.stop();
            bl.unload();
            for (bk = 0; bk < ao.soundIDs.length; bk++) {
                if (ao.soundIDs[bk] === bj) {
                    ao.soundIDs.splice(bk, 1);
                    break
                }
            }
            if (!bm) {
                bl.destruct(true)
            }
            bl = null;
            delete ao.sounds[bj];
            return true
        };
        this.load = function(bj, bk) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].load(bk)
        };
        this.unload = function(bj) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].unload()
        };
        this.onPosition = function(bm, bl, bk, bj) {
            if (!J(bm)) {
                return false
            }
            return ao.sounds[bm].onposition(bl, bk, bj)
        };
        this.onposition = this.onPosition;
        this.clearOnPosition = function(bl, bk, bj) {
            if (!J(bl)) {
                return false
            }
            return ao.sounds[bl].clearOnPosition(bk, bj)
        };
        this.play = function(bl, bm) {
            var bj = null,
                bk = (bm && !(bm instanceof Object));
            if (!ax || !ao.ok()) {
                ar(aW + ".play(): " + bd(!ax ? "notReady" : "notOK"));
                return false
            }
            if (!J(bl, bk)) {
                if (!bk) {
                    return false
                }
                if (bk) {
                    bm = {
                        url: bm
                    }
                }
                if (bm && bm.url) {
                    ao._wD(aW + '.play(): Attempting to create "' + bl + '"', 1);
                    bm.id = bl;
                    bj = ao.createSound(bm).play()
                }
            } else {
                if (bk) {
                    bm = {
                        url: bm
                    }
                }
            }
            if (bj === null) {
                bj = ao.sounds[bl].play(bm)
            }
            return bj
        };
        this.start = this.play;
        this.setPosition = function(bj, bk) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].setPosition(bk)
        };
        this.stop = function(bj) {
            if (!J(bj)) {
                return false
            }
            ao._wD(aW + ".stop(" + bj + ")", 1);
            return ao.sounds[bj].stop()
        };
        this.stopAll = function() {
            var bj;
            ao._wD(aW + ".stopAll()", 1);
            for (bj in ao.sounds) {
                if (ao.sounds.hasOwnProperty(bj)) {
                    ao.sounds[bj].stop()
                }
            }
        };
        this.pause = function(bj) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].pause()
        };
        this.pauseAll = function() {
            var bj;
            for (bj = ao.soundIDs.length - 1; bj >= 0; bj--) {
                ao.sounds[ao.soundIDs[bj]].pause()
            }
        };
        this.resume = function(bj) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].resume()
        };
        this.resumeAll = function() {
            var bj;
            for (bj = ao.soundIDs.length - 1; bj >= 0; bj--) {
                ao.sounds[ao.soundIDs[bj]].resume()
            }
        };
        this.togglePause = function(bj) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].togglePause()
        };
        this.setPan = function(bj, bk) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].setPan(bk)
        };
        this.setVolume = function(bk, bj) {
            if (!J(bk)) {
                return false
            }
            return ao.sounds[bk].setVolume(bj)
        };
        this.mute = function(bj) {
            var bk = 0;
            if (bj instanceof String) {
                bj = null
            }
            if (!bj) {
                ao._wD(aW + ".mute(): Muting all sounds");
                for (bk = ao.soundIDs.length - 1; bk >= 0; bk--) {
                    ao.sounds[ao.soundIDs[bk]].mute()
                }
                ao.muted = true
            } else {
                if (!J(bj)) {
                    return false
                }
                ao._wD(aW + '.mute(): Muting "' + bj + '"');
                return ao.sounds[bj].mute()
            }
            return true
        };
        this.muteAll = function() {
            ao.mute()
        };
        this.unmute = function(bj) {
            var bk;
            if (bj instanceof String) {
                bj = null
            }
            if (!bj) {
                ao._wD(aW + ".unmute(): Unmuting all sounds");
                for (bk = ao.soundIDs.length - 1; bk >= 0; bk--) {
                    ao.sounds[ao.soundIDs[bk]].unmute()
                }
                ao.muted = false
            } else {
                if (!J(bj)) {
                    return false
                }
                ao._wD(aW + '.unmute(): Unmuting "' + bj + '"');
                return ao.sounds[bj].unmute()
            }
            return true
        };
        this.unmuteAll = function() {
            ao.unmute()
        };
        this.toggleMute = function(bj) {
            if (!J(bj)) {
                return false
            }
            return ao.sounds[bj].toggleMute()
        };
        this.getMemoryUse = function() {
            var bj = 0;
            if (ad && bg !== 8) {
                bj = parseInt(ad._getMemoryUse(), 10)
            }
            return bj
        };
        this.disable = function(bk) {
            var bj;
            if (bk === d) {
                bk = false
            }
            if (a0) {
                return false
            }
            a0 = true;
            W("shutdown", 1);
            for (bj = ao.soundIDs.length - 1; bj >= 0; bj--) {
                X(ao.sounds[ao.soundIDs[bj]])
            }
            x(bk);
            al.remove(c, "load", t);
            return true
        };
        this.canPlayMIME = function(bk) {
            var bj;
            if (ao.hasHTML5) {
                bj = am({
                    type: bk
                })
            }
            if (!bj && C) {
                bj = (bk && ao.ok() ? !!((bg > 8 ? bk.match(f) : null) || bk.match(ao.mimePattern)) : null)
            }
            return bj
        };
        this.canPlayURL = function(bk) {
            var bj;
            if (ao.hasHTML5) {
                bj = am({
                    url: bk
                })
            }
            if (!bj && C) {
                bj = (bk && ao.ok() ? !!(bk.match(ao.filePattern)) : null)
            }
            return bj
        };
        this.canPlayLink = function(bj) {
            if (bj.type !== d && bj.type) {
                if (ao.canPlayMIME(bj.type)) {
                    return true
                }
            }
            return ao.canPlayURL(bj.href)
        };
        this.getSoundById = function(bk, bl) {
            if (!bk) {
                return null
            }
            var bj = ao.sounds[bk];
            if (!bj && !bl) {
                ao._wD(aW + '.getSoundById(): Sound "' + bk + '" not found.', 2)
            }
            return bj
        };
        this.onready = function(bl, bk) {
            var bm = "onready",
                bj = false;
            if (typeof bl === "function") {
                if (ax) {
                    ao._wD(bd("queue", bm))
                }
                if (!bk) {
                    bk = c
                }
                Z(bm, bl, bk);
                aR();
                bj = true
            } else {
                throw bd("needFunction", bm)
            }
            return bj
        };
        this.ontimeout = function(bl, bk) {
            var bm = "ontimeout",
                bj = false;
            if (typeof bl === "function") {
                if (ax) {
                    ao._wD(bd("queue", bm))
                }
                if (!bk) {
                    bk = c
                }
                Z(bm, bl, bk);
                aR({
                    type: bm
                });
                bj = true
            } else {
                throw bd("needFunction", bm)
            }
            return bj
        };
        this._writeDebug = function(bk, bj) {
            var bn = "soundmanager-debug",
                bm, bl;
            if (!ao.debugMode) {
                return false
            }
            if (K && ao.useConsole) {
                if (bj && typeof bj === "object") {
                    console.log(bk, bj)
                } else {
                    if (aH[bj] !== d) {
                        console[aH[bj]](bk)
                    } else {
                        console.log(bk)
                    }
                }
                if (ao.consoleOnly) {
                    return true
                }
            }
            bm = an(bn);
            if (!bm) {
                return false
            }
            bl = aa.createElement("div");
            if (++aw % 2 === 0) {
                bl.className = "sm2-alt"
            }
            if (bj === d) {
                bj = 0
            } else {
                bj = parseInt(bj, 10)
            }
            bl.appendChild(aa.createTextNode(bk));
            if (bj) {
                if (bj >= 2) {
                    bl.style.fontWeight = "bold"
                }
                if (bj === 3) {
                    bl.style.color = "#ff3333"
                }
            }
            bm.insertBefore(bl, bm.firstChild);
            bm = null;
            return true
        };
        if (y.indexOf("sm2-debug=alert") !== -1) {
            this._writeDebug = function(bj) {
                c.alert(bj)
            }
        }
        this._wD = this._writeDebug;
        this._debug = function() {
            var bk, bj;
            W("currentObj", 1);
            for (bk = 0, bj = ao.soundIDs.length; bk < bj; bk++) {
                ao.sounds[ao.soundIDs[bk]]._debug()
            }
        };
        this.reboot = function(bn, bm) {
            if (ao.soundIDs.length) {
                ao._wD("Destroying " + ao.soundIDs.length + " SMSound object" + (ao.soundIDs.length !== 1 ? "s" : "") + "...")
            }
            var bl, bk, bj;
            for (bl = ao.soundIDs.length - 1; bl >= 0; bl--) {
                ao.sounds[ao.soundIDs[bl]].destruct()
            }
            if (ad) {
                try {
                    if (a6) {
                        aj = ad.innerHTML
                    }
                    aK = ad.parentNode.removeChild(ad)
                } catch (bo) {
                    W("badRemove", 2)
                }
            }
            aj = aK = C = ad = null;
            ao.enabled = q = ax = aQ = aI = ap = aT = a0 = aY = ao.swfLoaded = false;
            ao.soundIDs = [];
            ao.sounds = {};
            ag = 0;
            if (!bn) {
                for (bl in w) {
                    if (w.hasOwnProperty(bl)) {
                        for (bk = 0, bj = w[bl].length; bk < bj; bk++) {
                            w[bl][bk].fired = false
                        }
                    }
                }
            } else {
                w = []
            }
            if (!bm) {
                ao._wD(aW + ": Rebooting...")
            }
            ao.html5 = {
                usingFlash: null
            };
            ao.flash = {};
            ao.html5Only = false;
            ao.ignoreFlash = false;
            c.setTimeout(function() {
                aD();
                if (!bm) {
                    ao.beginDelayedInit()
                }
            }, 20);
            return ao
        };
        this.reset = function() {
            W("reset");
            return ao.reboot(true, true)
        };
        this.getMoviePercent = function() {
            return (ad && "PercentLoaded" in ad ? ad.PercentLoaded() : null)
        };
        this.beginDelayedInit = function() {
            ba = true;
            M();
            setTimeout(function() {
                if (aI) {
                    return false
                }
                I();
                k();
                aI = true;
                return true
            }, 20);
            z()
        };
        this.destruct = function() {
            ao._wD(aW + ".destruct()");
            ao.disable(true)
        };
        ak = function(bx) {
            var by = this,
                bj, bu, br, bk, bo, bp, bl = false,
                bn = [],
                bv = 0,
                bm, bq, bs = null,
                bt, bw;
            bt = {
                duration: null,
                time: null
            };
            this.id = bx.id;
            this.sID = this.id;
            this.url = bx.url;
            this.options = a1(bx);
            this.instanceOptions = this.options;
            this._iO = this.instanceOptions;
            this.pan = this.options.pan;
            this.volume = this.options.volume;
            this.isHTML5 = false;
            this._a = null;
            bw = (this.url ? false : true);
            this.id3 = {};
            this._debug = function() {
                ao._wD(by.id + ": Merged options:", by.options)
            };
            this.load = function(bz) {
                var bA = null,
                    bB;
                if (bz !== d) {
                    by._iO = a1(bz, by.options)
                } else {
                    bz = by.options;
                    by._iO = bz;
                    if (bs && bs !== by.url) {
                        W("manURL");
                        by._iO.url = by.url;
                        by.url = null
                    }
                }
                if (!by._iO.url) {
                    by._iO.url = by.url
                }
                by._iO.url = ac(by._iO.url);
                by.instanceOptions = by._iO;
                bB = by._iO;
                ao._wD(by.id + ": load (" + bB.url + ")");
                if (!bB.url && !by.url) {
                    ao._wD(by.id + ": load(): url is unassigned. Exiting.", 2);
                    return by
                }
                if (!by.isHTML5 && bg === 8 && !by.url && !bB.autoPlay) {
                    ao._wD(by.id + ": Flash 8 load() limitation: Wait for onload() before calling play().", 1)
                }
                if (bB.url === by.url && by.readyState !== 0 && by.readyState !== 2) {
                    W("onURL", 1);
                    if (by.readyState === 3 && bB.onload) {
                        aE(by, function() {
                            bB.onload.apply(by, [(!!by.duration)])
                        })
                    }
                    return by
                }
                by.loaded = false;
                by.readyState = 1;
                by.playState = 0;
                by.id3 = {};
                if (a9(bB)) {
                    bA = by._setup_html5(bB);
                    if (!bA._called_load) {
                        by._html5_canplay = false;
                        if (by.url !== bB.url) {
                            ao._wD(W("manURL") + ": " + bB.url);
                            by._a.src = bB.url;
                            by.setPosition(0)
                        }
                        by._a.autobuffer = "auto";
                        by._a.preload = "auto";
                        by._a._called_load = true;
                        if (bB.autoPlay) {
                            by.play()
                        }
                    } else {
                        ao._wD(by.id + ": Ignoring request to load again")
                    }
                } else {
                    if (ao.html5Only) {
                        ao._wD(by.id + ": No flash support. Exiting.");
                        return by
                    }
                    if (by._iO.url && by._iO.url.match(/data\:/i)) {
                        ao._wD(by.id + ": data: URIs not supported via Flash. Exiting.");
                        return by
                    }
                    try {
                        by.isHTML5 = false;
                        by._iO = p(B(bB));
                        bB = by._iO;
                        if (bg === 8) {
                            ad._load(by.id, bB.url, bB.stream, bB.autoPlay, bB.usePolicyFile)
                        } else {
                            ad._load(by.id, bB.url, !!(bB.stream), !!(bB.autoPlay), bB.loops || 1, !!(bB.autoLoad), bB.usePolicyFile)
                        }
                    } catch (bC) {
                        W("smError", 2);
                        N("onload", false);
                        ab({
                            type: "SMSOUND_LOAD_JS_EXCEPTION",
                            fatal: true
                        })
                    }
                }
                by.url = bB.url;
                return by
            };
            this.unload = function() {
                if (by.readyState !== 0) {
                    ao._wD(by.id + ": unload()");
                    if (!by.isHTML5) {
                        if (bg === 8) {
                            ad._unload(by.id, o)
                        } else {
                            ad._unload(by.id)
                        }
                    } else {
                        bk();
                        if (by._a) {
                            by._a.pause();
                            bs = g(by._a)
                        }
                    }
                    bj()
                }
                return by
            };
            this.destruct = function(bz) {
                ao._wD(by.id + ": Destruct");
                if (!by.isHTML5) {
                    by._iO.onfailure = null;
                    ad._destroySound(by.id)
                } else {
                    bk();
                    if (by._a) {
                        by._a.pause();
                        g(by._a);
                        if (!aY) {
                            br()
                        }
                        by._a._s = null;
                        by._a = null
                    }
                }
                if (!bz) {
                    ao.destroySound(by.id, true)
                }
            };
            this.play = function(bF, bB) {
                var bz, bC, bI, bH, bJ, bG, bE, bD = true,
                    bA = null;
                bz = by.id + ": play(): ";
                bB = (bB === d ? true : bB);
                if (!bF) {
                    bF = {}
                }
                if (by.url) {
                    by._iO.url = by.url
                }
                by._iO = a1(by._iO, by.options);
                by._iO = a1(bF, by._iO);
                by._iO.url = ac(by._iO.url);
                by.instanceOptions = by._iO;
                if (!by.isHTML5 && by._iO.serverURL && !by.connected) {
                    if (!by.getAutoPlay()) {
                        ao._wD(bz + " Netstream not connected yet - setting autoPlay");
                        by.setAutoPlay(true)
                    }
                    return by
                }
                if (a9(by._iO)) {
                    by._setup_html5(by._iO);
                    bo()
                }
                if (by.playState === 1 && !by.paused) {
                    bC = by._iO.multiShot;
                    if (!bC) {
                        ao._wD(bz + "Already playing (one-shot)", 1);
                        if (by.isHTML5) {
                            by.setPosition(by._iO.position)
                        }
                        bA = by
                    } else {
                        ao._wD(bz + "Already playing (multi-shot)", 1)
                    }
                }
                if (bA !== null) {
                    return bA
                }
                if (bF.url && bF.url !== by.url) {
                    if (!by.readyState && !by.isHTML5 && bg === 8 && bw) {
                        bw = false
                    } else {
                        by.load(by._iO)
                    }
                }
                if (!by.loaded) {
                    if (by.readyState === 0) {
                        ao._wD(bz + "Attempting to load");
                        if (!by.isHTML5 && !ao.html5Only) {
                            by._iO.autoPlay = true;
                            by.load(by._iO)
                        } else {
                            if (by.isHTML5) {
                                by.load(by._iO)
                            } else {
                                ao._wD(bz + "Unsupported type. Exiting.");
                                bA = by
                            }
                        }
                        by.instanceOptions = by._iO
                    } else {
                        if (by.readyState === 2) {
                            ao._wD(bz + "Could not load - exiting", 2);
                            bA = by
                        } else {
                            ao._wD(bz + "Loading - attempting to play...")
                        }
                    }
                } else {
                    ao._wD(bz.substr(0, bz.lastIndexOf(":")))
                }
                if (bA !== null) {
                    return bA
                }
                if (!by.isHTML5 && bg === 9 && by.position > 0 && by.position === by.duration) {
                    ao._wD(bz + "Sound at end, resetting to position:0");
                    bF.position = 0
                }
                if (by.paused && by.position >= 0 && (!by._iO.serverURL || by.position > 0)) {
                    ao._wD(bz + "Resuming from paused state", 1);
                    by.resume()
                } else {
                    by._iO = a1(bF, by._iO);
                    if (by._iO.from !== null && by._iO.to !== null && by.instanceCount === 0 && by.playState === 0 && !by._iO.serverURL) {
                        bH = function() {
                            by._iO = a1(bF, by._iO);
                            by.play(by._iO)
                        };
                        if (by.isHTML5 && !by._html5_canplay) {
                            ao._wD(bz + "Beginning load for from/to case");
                            by.load({
                                oncanplay: bH
                            });
                            bA = false
                        } else {
                            if (!by.isHTML5 && !by.loaded && (!by.readyState || by.readyState !== 2)) {
                                ao._wD(bz + "Preloading for from/to case");
                                by.load({
                                    onload: bH
                                });
                                bA = false
                            }
                        }
                        if (bA !== null) {
                            return bA
                        }
                        by._iO = bq()
                    }
                    if (!by.instanceCount || by._iO.multiShotEvents || (by.isHTML5 && by._iO.multiShot && !aY) || (!by.isHTML5 && bg > 8 && !by.getAutoPlay())) {
                        by.instanceCount++
                    }
                    if (by._iO.onposition && by.playState === 0) {
                        bp(by)
                    }
                    by.playState = 1;
                    by.paused = false;
                    by.position = (by._iO.position !== d && !isNaN(by._iO.position) ? by._iO.position : 0);
                    if (!by.isHTML5) {
                        by._iO = p(B(by._iO))
                    }
                    if (by._iO.onplay && bB) {
                        by._iO.onplay.apply(by);
                        bl = true
                    }
                    by.setVolume(by._iO.volume, true);
                    by.setPan(by._iO.pan, true);
                    if (!by.isHTML5) {
                        bD = ad._start(by.id, by._iO.loops || 1, (bg === 9 ? by.position : by.position / h), by._iO.multiShot || false);
                        if (bg === 9 && !bD) {
                            ao._wD(bz + "No sound hardware, or 32-sound ceiling hit", 2);
                            if (by._iO.onplayerror) {
                                by._iO.onplayerror.apply(by)
                            }
                        }
                    } else {
                        if (by.instanceCount < 2) {
                            bo();
                            bI = by._setup_html5();
                            by.setPosition(by._iO.position);
                            bI.play()
                        } else {
                            ao._wD(by.id + ": Cloning Audio() for instance #" + by.instanceCount + "...");
                            bJ = new Audio(by._iO.url);
                            bG = function() {
                                al.remove(bJ, "onended", bG);
                                by._onfinish(by);
                                g(bJ);
                                bJ = null
                            };
                            bE = function() {
                                al.remove(bJ, "canplay", bE);
                                try {
                                    bJ.currentTime = by._iO.position / h
                                } catch (bK) {
                                    ar(by.id + ": multiShot play() failed to apply position of " + (by._iO.position / h))
                                }
                                bJ.play()
                            };
                            al.add(bJ, "ended", bG);
                            if (by._iO.position) {
                                al.add(bJ, "canplay", bE)
                            } else {
                                bJ.play()
                            }
                        }
                    }
                }
                return by
            };
            this.start = this.play;
            this.stop = function(bz) {
                var bB = by._iO,
                    bA;
                if (by.playState === 1) {
                    ao._wD(by.id + ": stop()");
                    by._onbufferchange(0);
                    by._resetOnPosition(0);
                    by.paused = false;
                    if (!by.isHTML5) {
                        by.playState = 0
                    }
                    bm();
                    if (bB.to) {
                        by.clearOnPosition(bB.to)
                    }
                    if (!by.isHTML5) {
                        ad._stop(by.id, bz);
                        if (bB.serverURL) {
                            by.unload()
                        }
                    } else {
                        if (by._a) {
                            bA = by.position;
                            by.setPosition(0);
                            by.position = bA;
                            by._a.pause();
                            by.playState = 0;
                            by._onTimer();
                            bk()
                        }
                    }
                    by.instanceCount = 0;
                    by._iO = {};
                    if (bB.onstop) {
                        bB.onstop.apply(by)
                    }
                }
                return by
            };
            this.setAutoPlay = function(bz) {
                ao._wD(by.id + ": Autoplay turned " + (bz ? "on" : "off"));
                by._iO.autoPlay = bz;
                if (!by.isHTML5) {
                    ad._setAutoPlay(by.id, bz);
                    if (bz) {
                        if (!by.instanceCount && by.readyState === 1) {
                            by.instanceCount++;
                            ao._wD(by.id + ": Incremented instance count to " + by.instanceCount)
                        }
                    }
                }
            };
            this.getAutoPlay = function() {
                return by._iO.autoPlay
            };
            this.setPosition = function(bB) {
                if (bB === d) {
                    bB = 0
                }
                var bz, bA, bD = (by.isHTML5 ? Math.max(bB, 0) : Math.min(by.duration || by._iO.duration, Math.max(bB, 0)));
                by.position = bD;
                bA = by.position / h;
                by._resetOnPosition(by.position);
                by._iO.position = bD;
                if (!by.isHTML5) {
                    bz = (bg === 9 ? by.position : bA);
                    if (by.readyState && by.readyState !== 2) {
                        ad._setPosition(by.id, bz, (by.paused || !by.playState), by._iO.multiShot)
                    }
                } else {
                    if (by._a) {
                        if (by._html5_canplay) {
                            if (by._a.currentTime !== bA) {
                                ao._wD(by.id + ": setPosition(" + bA + ")");
                                try {
                                    by._a.currentTime = bA;
                                    if (by.playState === 0 || by.paused) {
                                        by._a.pause()
                                    }
                                } catch (bC) {
                                    ao._wD(by.id + ": setPosition(" + bA + ") failed: " + bC.message, 2)
                                }
                            }
                        } else {
                            if (bA) {
                                ao._wD(by.id + ": setPosition(" + bA + "): Cannot seek yet, sound not ready", 2);
                                return by
                            }
                        }
                        if (by.paused) {
                            by._onTimer(true)
                        }
                    }
                }
                return by
            };
            this.pause = function(bz) {
                if (by.paused || (by.playState === 0 && by.readyState !== 1)) {
                    return by
                }
                ao._wD(by.id + ": pause()");
                by.paused = true;
                if (!by.isHTML5) {
                    if (bz || bz === d) {
                        ad._pause(by.id, by._iO.multiShot)
                    }
                } else {
                    by._setup_html5().pause();
                    bk()
                }
                if (by._iO.onpause) {
                    by._iO.onpause.apply(by)
                }
                return by
            };
            this.resume = function() {
                var bz = by._iO;
                if (!by.paused) {
                    return by
                }
                ao._wD(by.id + ": resume()");
                by.paused = false;
                by.playState = 1;
                if (!by.isHTML5) {
                    if (bz.isMovieStar && !bz.serverURL) {
                        by.setPosition(by.position)
                    }
                    ad._pause(by.id, bz.multiShot)
                } else {
                    by._setup_html5().play();
                    bo()
                }
                if (!bl && bz.onplay) {
                    bz.onplay.apply(by);
                    bl = true
                } else {
                    if (bz.onresume) {
                        bz.onresume.apply(by)
                    }
                }
                return by
            };
            this.togglePause = function() {
                ao._wD(by.id + ": togglePause()");
                if (by.playState === 0) {
                    by.play({
                        position: (bg === 9 && !by.isHTML5 ? by.position : by.position / h)
                    });
                    return by
                }
                if (by.paused) {
                    by.resume()
                } else {
                    by.pause()
                }
                return by
            };
            this.setPan = function(bA, bz) {
                if (bA === d) {
                    bA = 0
                }
                if (bz === d) {
                    bz = false
                }
                if (!by.isHTML5) {
                    ad._setPan(by.id, bA)
                }
                by._iO.pan = bA;
                if (!bz) {
                    by.pan = bA;
                    by.options.pan = bA
                }
                return by
            };
            this.setVolume = function(bz, bA) {
                if (bz === d) {
                    bz = 100
                }
                if (bA === d) {
                    bA = false
                }
                if (!by.isHTML5) {
                    ad._setVolume(by.id, (ao.muted && !by.muted) || by.muted ? 0 : bz)
                } else {
                    if (by._a) {
                        by._a.volume = Math.max(0, Math.min(1, bz / 100))
                    }
                }
                by._iO.volume = bz;
                if (!bA) {
                    by.volume = bz;
                    by.options.volume = bz
                }
                return by
            };
            this.mute = function() {
                by.muted = true;
                if (!by.isHTML5) {
                    ad._setVolume(by.id, 0)
                } else {
                    if (by._a) {
                        by._a.muted = true
                    }
                }
                return by
            };
            this.unmute = function() {
                by.muted = false;
                var bz = (by._iO.volume !== d);
                if (!by.isHTML5) {
                    ad._setVolume(by.id, bz ? by._iO.volume : by.options.volume)
                } else {
                    if (by._a) {
                        by._a.muted = false
                    }
                }
                return by
            };
            this.toggleMute = function() {
                return (by.muted ? by.unmute() : by.mute())
            };
            this.onPosition = function(bB, bA, bz) {
                bn.push({
                    position: parseInt(bB, 10),
                    method: bA,
                    scope: (bz !== d ? bz : by),
                    fired: false
                });
                return by
            };
            this.onposition = this.onPosition;
            this.clearOnPosition = function(bA, bz) {
                var bB;
                bA = parseInt(bA, 10);
                if (isNaN(bA)) {
                    return false
                }
                for (bB = 0; bB < bn.length; bB++) {
                    if (bA === bn[bB].position) {
                        if (!bz || (bz === bn[bB].method)) {
                            if (bn[bB].fired) {
                                bv--
                            }
                            bn.splice(bB, 1)
                        }
                    }
                }
            };
            this._processOnPosition = function() {
                var bA, bB, bz = bn.length;
                if (!bz || !by.playState || bv >= bz) {
                    return false
                }
                for (bA = bz - 1; bA >= 0; bA--) {
                    bB = bn[bA];
                    if (!bB.fired && by.position >= bB.position) {
                        bB.fired = true;
                        bv++;
                        bB.method.apply(bB.scope, [bB.position])
                    }
                }
                return true
            };
            this._resetOnPosition = function(bz) {
                var bB, bC, bA = bn.length;
                if (!bA) {
                    return false
                }
                for (bB = bA - 1; bB >= 0; bB--) {
                    bC = bn[bB];
                    if (bC.fired && bz <= bC.position) {
                        bC.fired = false;
                        bv--
                    }
                }
                return true
            };
            bq = function() {
                var bC = by._iO,
                    bB = bC.from,
                    bA = bC.to,
                    bD, bz;
                bz = function() {
                    ao._wD(by.id + ': "To" time of ' + bA + " reached.");
                    by.clearOnPosition(bA, bz);
                    by.stop()
                };
                bD = function() {
                    ao._wD(by.id + ': Playing "from" ' + bB);
                    if (bA !== null && !isNaN(bA)) {
                        by.onPosition(bA, bz)
                    }
                };
                if (bB !== null && !isNaN(bB)) {
                    bC.position = bB;
                    bC.multiShot = false;
                    bD()
                }
                return bC
            };
            bp = function() {
                var bz, bA = by._iO.onposition;
                if (bA) {
                    for (bz in bA) {
                        if (bA.hasOwnProperty(bz)) {
                            by.onPosition(parseInt(bz, 10), bA[bz])
                        }
                    }
                }
            };
            bm = function() {
                var bz, bA = by._iO.onposition;
                if (bA) {
                    for (bz in bA) {
                        if (bA.hasOwnProperty(bz)) {
                            by.clearOnPosition(parseInt(bz, 10))
                        }
                    }
                }
            };
            bo = function() {
                if (by.isHTML5) {
                    aO(by)
                }
            };
            bk = function() {
                if (by.isHTML5) {
                    O(by)
                }
            };
            bj = function(bz) {
                if (!bz) {
                    bn = [];
                    bv = 0
                }
                bl = false;
                by._hasTimer = null;
                by._a = null;
                by._html5_canplay = false;
                by.bytesLoaded = null;
                by.bytesTotal = null;
                by.duration = (by._iO && by._iO.duration ? by._iO.duration : null);
                by.durationEstimate = null;
                by.buffered = [];
                by.eqData = [];
                by.eqData.left = [];
                by.eqData.right = [];
                by.failures = 0;
                by.isBuffering = false;
                by.instanceOptions = {};
                by.instanceCount = 0;
                by.loaded = false;
                by.metadata = {};
                by.readyState = 0;
                by.muted = false;
                by.paused = false;
                by.peakData = {
                    left: 0,
                    right: 0
                };
                by.waveformData = {
                    left: [],
                    right: []
                };
                by.playState = 0;
                by.position = null;
                by.id3 = {}
            };
            bj();
            this._onTimer = function(bB) {
                var bD, bA = false,
                    bC, bz = {};
                if (by._hasTimer || bB) {
                    if (by._a && (bB || ((by.playState > 0 || by.readyState === 1) && !by.paused))) {
                        bD = by._get_html5_duration();
                        if (bD !== bt.duration) {
                            bt.duration = bD;
                            by.duration = bD;
                            bA = true
                        }
                        by.durationEstimate = by.duration;
                        bC = (by._a.currentTime * h || 0);
                        if (bC !== bt.time) {
                            bt.time = bC;
                            bA = true
                        }
                        if (bA || bB) {
                            by._whileplaying(bC, bz, bz, bz, bz)
                        }
                    }
                    return bA
                }
            };
            this._get_html5_duration = function() {
                var bA = by._iO,
                    bB = (by._a && by._a.duration ? by._a.duration * h : (bA && bA.duration ? bA.duration : null)),
                    bz = (bB && !isNaN(bB) && bB !== Infinity ? bB : null);
                return bz
            };
            this._apply_loop = function(bz, bA) {
                if (!bz.loop && bA > 1) {
                    ao._wD("Note: Native HTML5 looping is infinite.", 1)
                }
                bz.loop = (bA > 1 ? "loop" : "")
            };
            this._setup_html5 = function(bA) {
                var bB = a1(by._iO, bA),
                    bz = aY ? a7 : by._a,
                    bD = decodeURI(bB.url),
                    bC;
                if (aY) {
                    if (bD === decodeURI(l)) {
                        bC = true
                    }
                } else {
                    if (bD === decodeURI(bs)) {
                        bC = true
                    }
                }
                if (bz) {
                    if (bz._s) {
                        if (aY) {
                            if (bz._s && bz._s.playState && !bC) {
                                bz._s.stop()
                            }
                        } else {
                            if (!aY && bD === decodeURI(bs)) {
                                by._apply_loop(bz, bB.loops);
                                return bz
                            }
                        }
                    }
                    if (!bC) {
                        bj(false);
                        bz.src = bB.url;
                        by.url = bB.url;
                        bs = bB.url;
                        l = bB.url;
                        bz._called_load = false
                    }
                } else {
                    if (bB.autoLoad || bB.autoPlay) {
                        by._a = new Audio(bB.url)
                    } else {
                        by._a = (v && opera.version() < 10 ? new Audio(null) : new Audio())
                    }
                    bz = by._a;
                    bz._called_load = false;
                    if (aY) {
                        a7 = bz
                    }
                }
                by.isHTML5 = true;
                by._a = bz;
                bz._s = by;
                bu();
                by._apply_loop(bz, bB.loops);
                if (bB.autoLoad || bB.autoPlay) {
                    by.load()
                } else {
                    bz.autobuffer = false;
                    bz.preload = "auto"
                }
                return bz
            };
            bu = function() {
                if (by._a._added_events) {
                    return false
                }
                var bz;

                function bA(bC, bB, bD) {
                    return by._a ? by._a.addEventListener(bC, bB, bD || false) : null
                }
                by._a._added_events = true;
                for (bz in i) {
                    if (i.hasOwnProperty(bz)) {
                        bA(bz, i[bz])
                    }
                }
                return true
            };
            br = function() {
                var bA;

                function bz(bC, bB, bD) {
                    return (by._a ? by._a.removeEventListener(bC, bB, bD || false) : null)
                }
                ao._wD(by.id + ": Removing event listeners");
                by._a._added_events = false;
                for (bA in i) {
                    if (i.hasOwnProperty(bA)) {
                        bz(bA, i[bA])
                    }
                }
            };
            this._onload = function(bB) {
                var bz, bA = !!bB || (!by.isHTML5 && bg === 8 && by.duration);
                bz = by.id + ": ";
                ao._wD(bz + (bA ? "onload()" : "Failed to load / invalid sound?" + (!by.duration ? " Zero-length duration reported." : " -") + " (" + by.url + ")"), (bA ? 1 : 2));
                if (!bA && !by.isHTML5) {
                    if (ao.sandbox.noRemote === true) {
                        ao._wD(bz + bd("noNet"), 1)
                    }
                    if (ao.sandbox.noLocal === true) {
                        ao._wD(bz + bd("noLocal"), 1)
                    }
                }
                by.loaded = bA;
                by.readyState = bA ? 3 : 2;
                by._onbufferchange(0);
                if (by._iO.onload) {
                    aE(by, function() {
                        by._iO.onload.apply(by, [bA])
                    })
                }
                return true
            };
            this._onbufferchange = function(bz) {
                if (by.playState === 0) {
                    return false
                }
                if ((bz && by.isBuffering) || (!bz && !by.isBuffering)) {
                    return false
                }
                by.isBuffering = (bz === 1);
                if (by._iO.onbufferchange) {
                    ao._wD(by.id + ": Buffer state change: " + bz);
                    by._iO.onbufferchange.apply(by)
                }
                return true
            };
            this._onsuspend = function() {
                if (by._iO.onsuspend) {
                    ao._wD(by.id + ": Playback suspended");
                    by._iO.onsuspend.apply(by)
                }
                return true
            };
            this._onfailure = function(bA, bB, bz) {
                by.failures++;
                ao._wD(by.id + ": Failures = " + by.failures);
                if (by._iO.onfailure && by.failures === 1) {
                    by._iO.onfailure(by, bA, bB, bz)
                } else {
                    ao._wD(by.id + ": Ignoring failure")
                }
            };
            this._onfinish = function() {
                var bz = by._iO.onfinish;
                by._onbufferchange(0);
                by._resetOnPosition(0);
                if (by.instanceCount) {
                    by.instanceCount--;
                    if (!by.instanceCount) {
                        bm();
                        by.playState = 0;
                        by.paused = false;
                        by.instanceCount = 0;
                        by.instanceOptions = {};
                        by._iO = {};
                        bk();
                        if (by.isHTML5) {
                            by.position = 0
                        }
                    }
                    if (!by.instanceCount || by._iO.multiShotEvents) {
                        if (bz) {
                            ao._wD(by.id + ": onfinish()");
                            aE(by, function() {
                                bz.apply(by)
                            })
                        }
                    }
                }
            };
            this._whileloading = function(bz, bA, bD, bC) {
                var bB = by._iO;
                by.bytesLoaded = bz;
                by.bytesTotal = bA;
                by.duration = Math.floor(bD);
                by.bufferLength = bC;
                if (!by.isHTML5 && !bB.isMovieStar) {
                    if (bB.duration) {
                        by.durationEstimate = (by.duration > bB.duration) ? by.duration : bB.duration
                    } else {
                        by.durationEstimate = parseInt((by.bytesTotal / by.bytesLoaded) * by.duration, 10)
                    }
                } else {
                    by.durationEstimate = by.duration
                }
                if (!by.isHTML5) {
                    by.buffered = [{
                        start: 0,
                        end: by.duration
                    }]
                }
                if ((by.readyState !== 3 || by.isHTML5) && bB.whileloading) {
                    bB.whileloading.apply(by)
                }
            };
            this._whileplaying = function(bB, bC, bF, bA, bE) {
                var bD = by._iO,
                    bz;
                if (isNaN(bB) || bB === null) {
                    return false
                }
                by.position = Math.max(0, bB);
                by._processOnPosition();
                if (!by.isHTML5 && bg > 8) {
                    if (bD.usePeakData && bC !== d && bC) {
                        by.peakData = {
                            left: bC.leftPeak,
                            right: bC.rightPeak
                        }
                    }
                    if (bD.useWaveformData && bF !== d && bF) {
                        by.waveformData = {
                            left: bF.split(","),
                            right: bA.split(",")
                        }
                    }
                    if (bD.useEQData) {
                        if (bE !== d && bE && bE.leftEQ) {
                            bz = bE.leftEQ.split(",");
                            by.eqData = bz;
                            by.eqData.left = bz;
                            if (bE.rightEQ !== d && bE.rightEQ) {
                                by.eqData.right = bE.rightEQ.split(",")
                            }
                        }
                    }
                }
                if (by.playState === 1) {
                    if (!by.isHTML5 && bg === 8 && !by.position && by.isBuffering) {
                        by._onbufferchange(0)
                    }
                    if (bD.whileplaying) {
                        bD.whileplaying.apply(by)
                    }
                }
                return true
            };
            this._oncaptiondata = function(bz) {
                ao._wD(by.id + ": Caption data received.");
                by.captiondata = bz;
                if (by._iO.oncaptiondata) {
                    by._iO.oncaptiondata.apply(by, [bz])
                }
            };
            this._onmetadata = function(bC, bz) {
                ao._wD(by.id + ": Metadata received.");
                var bD = {},
                    bB, bA;
                for (bB = 0, bA = bC.length; bB < bA; bB++) {
                    bD[bC[bB]] = bz[bB]
                }
                by.metadata = bD;
                if (by._iO.onmetadata) {
                    by._iO.onmetadata.apply(by)
                }
            };
            this._onid3 = function(bC, bz) {
                ao._wD(by.id + ": ID3 data received.");
                var bD = [],
                    bB, bA;
                for (bB = 0, bA = bC.length; bB < bA; bB++) {
                    bD[bC[bB]] = bz[bB]
                }
                by.id3 = a1(by.id3, bD);
                if (by._iO.onid3) {
                    by._iO.onid3.apply(by)
                }
            };
            this._onconnect = function(bz) {
                bz = (bz === 1);
                ao._wD(by.id + ": " + (bz ? "Connected." : "Failed to connect? - " + by.url), (bz ? 1 : 2));
                by.connected = bz;
                if (bz) {
                    by.failures = 0;
                    if (J(by.id)) {
                        if (by.getAutoPlay()) {
                            by.play(d, by.getAutoPlay())
                        } else {
                            if (by._iO.autoLoad) {
                                by.load()
                            }
                        }
                    }
                    if (by._iO.onconnect) {
                        by._iO.onconnect.apply(by, [bz])
                    }
                }
            };
            this._ondataerror = function(bz) {
                if (by.playState > 0) {
                    ao._wD(by.id + ": Data error: " + bz);
                    if (by._iO.ondataerror) {
                        by._iO.ondataerror.apply(by)
                    }
                }
            };
            this._debug()
        };
        be = function() {
            return (aa.body || aa._docElement || aa.getElementsByTagName("div")[0])
        };
        an = function(bj) {
            return aa.getElementById(bj)
        };
        a1 = function(bk, bj) {
            var bm = (bk || {}),
                bl, bn;
            bl = (bj === d ? ao.defaultOptions : bj);
            for (bn in bl) {
                if (bl.hasOwnProperty(bn) && bm[bn] === d) {
                    if (typeof bl[bn] !== "object" || bl[bn] === null) {
                        bm[bn] = bl[bn]
                    } else {
                        bm[bn] = a1(bm[bn], bl[bn])
                    }
                }
            }
            return bm
        };
        aE = function(bj, bk) {
            if (!bj.isHTML5 && bg === 8) {
                c.setTimeout(bk, 0)
            } else {
                bk()
            }
        };
        a2 = {
            onready: 1,
            ontimeout: 1,
            defaultOptions: 1,
            flash9Options: 1,
            movieStarOptions: 1
        };
        a5 = function(bp, bo) {
            var bn, bk = true,
                bj = (bo !== d),
                bm = ao.setupOptions,
                bl = a2;
            if (bp === d) {
                bk = [];
                for (bn in bm) {
                    if (bm.hasOwnProperty(bn)) {
                        bk.push(bn)
                    }
                }
                for (bn in bl) {
                    if (bl.hasOwnProperty(bn)) {
                        if (typeof ao[bn] === "object") {
                            bk.push(bn + ": {...}")
                        } else {
                            if (ao[bn] instanceof Function) {
                                bk.push(bn + ": function() {...}")
                            } else {
                                bk.push(bn)
                            }
                        }
                    }
                }
                ao._wD(bd("setup", bk.join(", ")));
                return false
            }
            for (bn in bp) {
                if (bp.hasOwnProperty(bn)) {
                    if (typeof bp[bn] !== "object" || bp[bn] === null || bp[bn] instanceof Array || bp[bn] instanceof RegExp) {
                        if (bj && bl[bo] !== d) {
                            ao[bo][bn] = bp[bn]
                        } else {
                            if (bm[bn] !== d) {
                                ao.setupOptions[bn] = bp[bn];
                                ao[bn] = bp[bn]
                            } else {
                                if (bl[bn] === d) {
                                    ar(bd((ao[bn] === d ? "setupUndef" : "setupError"), bn), 2);
                                    bk = false
                                } else {
                                    if (ao[bn] instanceof Function) {
                                        ao[bn].apply(ao, (bp[bn] instanceof Array ? bp[bn] : [bp[bn]]))
                                    } else {
                                        ao[bn] = bp[bn]
                                    }
                                }
                            }
                        }
                    } else {
                        if (bl[bn] === d) {
                            ar(bd((ao[bn] === d ? "setupUndef" : "setupError"), bn), 2);
                            bk = false
                        } else {
                            return a5(bp[bn], bn)
                        }
                    }
                }
            }
            return bk
        };

        function bh(bj) {
            return (ao.preferFlash && at && !ao.ignoreFlash && (ao.flash[bj] !== d && ao.flash[bj]))
        }
        al = (function() {
            var bl = (c.attachEvent),
                bk = {
                    add: (bl ? "attachEvent" : "addEventListener"),
                    remove: (bl ? "detachEvent" : "removeEventListener")
                };

            function bn(br) {
                var bq = S.call(br),
                    bp = bq.length;
                if (bl) {
                    bq[1] = "on" + bq[1];
                    if (bp > 3) {
                        bq.pop()
                    }
                } else {
                    if (bp === 3) {
                        bq.push(false)
                    }
                }
                return bq
            }

            function bm(bp, bs) {
                var bq = bp.shift(),
                    br = [bk[bs]];
                if (bl) {
                    bq[br](bp[0], bp[1])
                } else {
                    bq[br].apply(bq, bp)
                }
            }

            function bo() {
                bm(bn(arguments), "add")
            }

            function bj() {
                bm(bn(arguments), "remove")
            }
            return {
                add: bo,
                remove: bj
            }
        }());

        function aP(bj) {
            return function(bm) {
                var bl = this._s,
                    bk;
                if (!bl || !bl._a) {
                    if (bl && bl.id) {
                        ao._wD(bl.id + ": Ignoring " + bm.type)
                    } else {
                        ao._wD(a3 + "Ignoring " + bm.type)
                    }
                    bk = null
                } else {
                    bk = bj.call(this, bm)
                }
                return bk
            }
        }
        i = {
            abort: aP(function() {
                ao._wD(this._s.id + ": abort")
            }),
            canplay: aP(function() {
                var bl = this._s,
                    bk;
                if (bl._html5_canplay) {
                    return true
                }
                bl._html5_canplay = true;
                ao._wD(bl.id + ": canplay");
                bl._onbufferchange(0);
                bk = (bl._iO.position !== d && !isNaN(bl._iO.position) ? bl._iO.position / h : null);
                if (bl.position && this.currentTime !== bk) {
                    ao._wD(bl.id + ": canplay: Setting position to " + bk);
                    try {
                        this.currentTime = bk
                    } catch (bj) {
                        ao._wD(bl.id + ": canplay: Setting position of " + bk + " failed: " + bj.message, 2)
                    }
                }
                if (bl._iO._oncanplay) {
                    bl._iO._oncanplay()
                }
            }),
            canplaythrough: aP(function() {
                var bj = this._s;
                if (!bj.loaded) {
                    bj._onbufferchange(0);
                    bj._whileloading(bj.bytesLoaded, bj.bytesTotal, bj._get_html5_duration());
                    bj._onload(true)
                }
            }),
            ended: aP(function() {
                var bj = this._s;
                ao._wD(bj.id + ": ended");
                bj._onfinish()
            }),
            error: aP(function() {
                ao._wD(this._s.id + ": HTML5 error, code " + this.error.code);
                this._s._onload(false)
            }),
            loadeddata: aP(function() {
                var bj = this._s;
                ao._wD(bj.id + ": loadeddata");
                if (!bj._loaded && !aX) {
                    bj.duration = bj._get_html5_duration()
                }
            }),
            loadedmetadata: aP(function() {
                ao._wD(this._s.id + ": loadedmetadata")
            }),
            loadstart: aP(function() {
                ao._wD(this._s.id + ": loadstart");
                this._s._onbufferchange(1)
            }),
            play: aP(function() {
                this._s._onbufferchange(0)
            }),
            playing: aP(function() {
                ao._wD(this._s.id + ": playing");
                this._s._onbufferchange(0)
            }),
            progress: aP(function(bo) {
                var bs = this._s,
                    bn, bl, bp, bk = 0,
                    br = (bo.type === "progress"),
                    bj = bo.target.buffered,
                    bm = (bo.loaded || 0),
                    bq = (bo.total || 1);
                bs.buffered = [];
                if (bj && bj.length) {
                    for (bn = 0, bl = bj.length; bn < bl; bn++) {
                        bs.buffered.push({
                            start: bj.start(bn) * h,
                            end: bj.end(bn) * h
                        })
                    }
                    bk = (bj.end(0) - bj.start(0)) * h;
                    bm = Math.min(1, bk / (bo.target.duration * h));
                    if (br && bj.length > 1) {
                        bp = [];
                        bl = bj.length;
                        for (bn = 0; bn < bl; bn++) {
                            bp.push(bo.target.buffered.start(bn) * h + "-" + bo.target.buffered.end(bn) * h)
                        }
                        ao._wD(this._s.id + ": progress, timeRanges: " + bp.join(", "))
                    }
                    if (br && !isNaN(bm)) {
                        ao._wD(this._s.id + ": progress, " + Math.floor(bm * 100) + "% loaded")
                    }
                }
                if (!isNaN(bm)) {
                    bs._onbufferchange(0);
                    bs._whileloading(bm, bq, bs._get_html5_duration());
                    if (bm && bq && bm === bq) {
                        i.canplaythrough.call(this, bo)
                    }
                }
            }),
            ratechange: aP(function() {
                ao._wD(this._s.id + ": ratechange")
            }),
            suspend: aP(function(bk) {
                var bj = this._s;
                ao._wD(this._s.id + ": suspend");
                i.progress.call(this, bk);
                bj._onsuspend()
            }),
            stalled: aP(function() {
                ao._wD(this._s.id + ": stalled")
            }),
            timeupdate: aP(function() {
                this._s._onTimer()
            }),
            waiting: aP(function() {
                var bj = this._s;
                ao._wD(this._s.id + ": waiting");
                bj._onbufferchange(1)
            })
        };
        a9 = function(bk) {
            var bj;
            if (!bk || (!bk.type && !bk.url && !bk.serverURL)) {
                bj = false
            } else {
                if (bk.serverURL || (bk.type && bh(bk.type))) {
                    bj = false
                } else {
                    bj = ((bk.type ? am({
                        type: bk.type
                    }) : am({
                        url: bk.url
                    }) || ao.html5Only || bk.url.match(/data\:/i)))
                }
            }
            return bj
        };
        g = function(bj) {
            var bk;
            if (bj) {
                bk = (aX && !aV ? null : (j ? o : null));
                bj.src = bk;
                if (bj._called_unload !== undefined) {
                    bj._called_load = false
                }
            }
            if (aY) {
                l = null
            }
            return bk
        };
        am = function(bq) {
            if (!ao.useHTML5Audio || !ao.hasHTML5) {
                return false
            }
            var bm = (bq.url || null),
                bo = (bq.type || null),
                bk = ao.audioFormats,
                bj, bp, bl, bn;
            if (bo && ao.html5[bo] !== d) {
                return (ao.html5[bo] && !bh(bo))
            }
            if (!aL) {
                aL = [];
                for (bn in bk) {
                    if (bk.hasOwnProperty(bn)) {
                        aL.push(bn);
                        if (bk[bn].related) {
                            aL = aL.concat(bk[bn].related)
                        }
                    }
                }
                aL = new RegExp("\\.(" + aL.join("|") + ")(\\?.*)?$", "i")
            }
            bl = (bm ? bm.toLowerCase().match(aL) : null);
            if (!bl || !bl.length) {
                if (!bo) {
                    bj = false
                } else {
                    bp = bo.indexOf(";");
                    bl = (bp !== -1 ? bo.substr(0, bp) : bo).substr(6)
                }
            } else {
                bl = bl[1]
            }
            if (bl && ao.html5[bl] !== d) {
                bj = (ao.html5[bl] && !bh(bl))
            } else {
                bo = "audio/" + bl;
                bj = ao.html5.canPlayType({
                    type: bo
                });
                ao.html5[bl] = bj;
                bj = (bj && ao.html5[bo] && !bh(bo))
            }
            return bj
        };
        aN = function() {
            if (!ao.useHTML5Audio || !ao.hasHTML5) {
                ao.html5.usingFlash = true;
                C = true;
                return false
            }
            var bj = (Audio !== d ? (v && opera.version() < 10 ? new Audio(null) : new Audio()) : null),
                bn, bp, bm = {},
                bk, bl;

            function bo(bs) {
                var bu, bv, bt, br = false,
                    bq = false;
                if (!bj || typeof bj.canPlayType !== "function") {
                    return br
                }
                if (bs instanceof Array) {
                    for (bv = 0, bt = bs.length; bv < bt; bv++) {
                        if (ao.html5[bs[bv]] || bj.canPlayType(bs[bv]).match(ao.html5Test)) {
                            bq = true;
                            ao.html5[bs[bv]] = true;
                            ao.flash[bs[bv]] = !!(bs[bv].match(r))
                        }
                    }
                    br = bq
                } else {
                    bu = (bj && typeof bj.canPlayType === "function" ? bj.canPlayType(bs) : false);
                    br = !!(bu && (bu.match(ao.html5Test)))
                }
                return br
            }
            bk = ao.audioFormats;
            for (bn in bk) {
                if (bk.hasOwnProperty(bn)) {
                    bp = "audio/" + bn;
                    bm[bn] = bo(bk[bn].type);
                    bm[bp] = bm[bn];
                    if (bn.match(r)) {
                        ao.flash[bn] = true;
                        ao.flash[bp] = true
                    } else {
                        ao.flash[bn] = false;
                        ao.flash[bp] = false
                    }
                    if (bk[bn] && bk[bn].related) {
                        for (bl = bk[bn].related.length - 1; bl >= 0; bl--) {
                            bm["audio/" + bk[bn].related[bl]] = bm[bn];
                            ao.html5[bk[bn].related[bl]] = bm[bn];
                            ao.flash[bk[bn].related[bl]] = bm[bn]
                        }
                    }
                }
            }
            bm.canPlayType = (bj ? bo : null);
            ao.html5 = a1(ao.html5, bm);
            ao.html5.usingFlash = T();
            C = ao.html5.usingFlash;
            return true
        };
        e = {
            notReady: "Unavailable - wait until onready() has fired.",
            notOK: "Audio support is not available.",
            domError: aW + "exception caught while appending SWF to DOM.",
            spcWmode: "Removing wmode, preventing known SWF loading issue(s)",
            swf404: G + "Verify that %s is a valid path.",
            tryDebug: "Try " + aW + ".debugFlash = true for more security details (output goes to SWF.)",
            checkSWF: "See SWF output for more debug info.",
            localFail: G + "Non-HTTP page (" + aa.location.protocol + " URL?) Review Flash player security settings for this special case:\nhttp://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html\nMay need to add/allow path, eg. c:/sm2/ or /users/me/sm2/",
            waitFocus: G + "Special case: Waiting for SWF to load with window focus...",
            waitForever: G + "Waiting indefinitely for Flash (will recover if unblocked)...",
            waitSWF: G + "Waiting for 100% SWF load...",
            needFunction: G + "Function object expected for %s",
            badID: 'Sound ID "%s" should be a string, starting with a non-numeric character',
            currentObj: G + "_debug(): Current sound objects",
            waitOnload: G + "Waiting for window.onload()",
            docLoaded: G + "Document already loaded",
            onload: G + "initComplete(): calling soundManager.onload()",
            onloadOK: aW + ".onload() complete",
            didInit: G + "init(): Already called?",
            secNote: "Flash security note: Network/internet URLs will not load due to security restrictions. Access can be configured via Flash Player Global Security Settings Page: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html",
            badRemove: G + "Failed to remove Flash node.",
            shutdown: aW + ".disable(): Shutting down",
            queue: G + "Queueing %s handler",
            smError: "SMSound.load(): Exception: JS-Flash communication failed, or JS error.",
            fbTimeout: "No flash response, applying ." + F.swfTimedout + " CSS...",
            fbLoaded: "Flash loaded",
            fbHandler: G + "flashBlockHandler()",
            manURL: "SMSound.load(): Using manually-assigned URL",
            onURL: aW + ".load(): current URL already assigned.",
            badFV: aW + '.flashVersion must be 8 or 9. "%s" is invalid. Reverting to %s.',
            as2loop: "Note: Setting stream:false so looping can work (flash 8 limitation)",
            noNSLoop: "Note: Looping not implemented for MovieStar formats",
            needfl9: "Note: Switching to flash 9, required for MP4 formats.",
            mfTimeout: "Setting flashLoadTimeout = 0 (infinite) for off-screen, mobile flash case",
            needFlash: G + "Fatal error: Flash is needed to play some required formats, but is not available.",
            gotFocus: G + "Got window focus.",
            policy: "Enabling usePolicyFile for data access",
            setup: aW + ".setup(): allowed parameters: %s",
            setupError: aW + '.setup(): "%s" cannot be assigned with this method.',
            setupUndef: aW + '.setup(): Could not find option "%s"',
            setupLate: aW + ".setup(): url, flashVersion and html5Test property changes will not take effect until reboot().",
            noURL: G + "Flash URL required. Call soundManager.setup({url:...}) to get started.",
            sm2Loaded: "SoundManager 2: Ready.",
            reset: aW + ".reset(): Removing event callbacks",
            mobileUA: "Mobile UA detected, preferring HTML5 by default.",
            globalHTML5: "Using singleton HTML5 Audio() pattern for this device."
        };
        bd = function() {
            var bk = S.call(arguments),
                bn = bk.shift(),
                bm = (e && e[bn] ? e[bn] : ""),
                bl, bj;
            if (bm && bk && bk.length) {
                for (bl = 0, bj = bk.length; bl < bj; bl++) {
                    bm = bm.replace("%s", bk[bl])
                }
            }
            return bm
        };
        B = function(bj) {
            if (bg === 8 && bj.loops > 1 && bj.stream) {
                W("as2loop");
                bj.stream = false
            }
            return bj
        };
        p = function(bk, bj) {
            if (bk && !bk.usePolicyFile && (bk.onid3 || bk.usePeakData || bk.useWaveformData || bk.useEQData)) {
                ao._wD((bj || "") + bd("policy"));
                bk.usePolicyFile = true
            }
            return bk
        };
        ar = function(bj) {
            if (K && console.warn !== d) {
                console.warn(bj)
            } else {
                ao._wD(bj)
            }
        };
        U = function() {
            return false
        };
        X = function(bk) {
            var bj;
            for (bj in bk) {
                if (bk.hasOwnProperty(bj) && typeof bk[bj] === "function") {
                    bk[bj] = U
                }
            }
            bj = null
        };
        s = function(bj) {
            if (bj === d) {
                bj = false
            }
            if (a0 || bj) {
                ao.disable(bj)
            }
        };
        az = function(bj) {
            var bk = null,
                bl;
            if (bj) {
                if (bj.match(/\.swf(\?.*)?$/i)) {
                    bk = bj.substr(bj.toLowerCase().lastIndexOf(".swf?") + 4);
                    if (bk) {
                        return bj
                    }
                } else {
                    if (bj.lastIndexOf("/") !== bj.length - 1) {
                        bj += "/"
                    }
                }
            }
            bl = (bj && bj.lastIndexOf("/") !== -1 ? bj.substr(0, bj.lastIndexOf("/") + 1) : "./") + ao.movieURL;
            if (ao.noSWFCache) {
                bl += ("?ts=" + new Date().getTime())
            }
            return bl
        };
        aU = function() {
            bg = parseInt(ao.flashVersion, 10);
            if (bg !== 8 && bg !== 9) {
                ao._wD(bd("badFV", bg, Y));
                ao.flashVersion = bg = Y
            }
            var bj = (ao.debugMode || ao.debugFlash ? "_debug.swf" : ".swf");
            if (ao.useHTML5Audio && !ao.html5Only && ao.audioFormats.mp4.required && bg < 9) {
                ao._wD(bd("needfl9"));
                ao.flashVersion = bg = 9
            }
            ao.version = ao.versionNumber + (ao.html5Only ? " (HTML5-only mode)" : (bg === 9 ? " (AS3/Flash 9)" : " (AS2/Flash 8)"));
            if (bg > 8) {
                ao.defaultOptions = a1(ao.defaultOptions, ao.flash9Options);
                ao.features.buffering = true;
                ao.defaultOptions = a1(ao.defaultOptions, ao.movieStarOptions);
                ao.filePatterns.flash9 = new RegExp("\\.(mp3|" + V.join("|") + ")(\\?.*)?$", "i");
                ao.features.movieStar = true
            } else {
                ao.features.movieStar = false
            }
            ao.filePattern = ao.filePatterns[(bg !== 8 ? "flash9" : "flash8")];
            ao.movieURL = (bg === 8 ? "soundmanager2.swf" : "soundmanager2_flash9.swf").replace(".swf", bj);
            ao.features.peakData = ao.features.waveformData = ao.features.eqData = (bg > 8)
        };
        m = function(bj, bk) {
            if (!ad) {
                return false
            }
            ad._setPolling(bj, bk)
        };
        E = function() {
            if (ao.debugURLParam.test(y)) {
                ao.debugMode = true
            }
            if (an(ao.debugID)) {
                return false
            }
            var bo, bn, bj, bl, bk;
            if (ao.debugMode && !an(ao.debugID) && (!K || !ao.useConsole || !ao.consoleOnly)) {
                bo = aa.createElement("div");
                bo.id = ao.debugID + "-toggle";
                bl = {
                    position: "fixed",
                    bottom: "0px",
                    right: "0px",
                    width: "1.2em",
                    height: "1.2em",
                    lineHeight: "1.2em",
                    margin: "2px",
                    textAlign: "center",
                    border: "1px solid #999",
                    cursor: "pointer",
                    background: "#fff",
                    color: "#333",
                    zIndex: 10001
                };
                bo.appendChild(aa.createTextNode("-"));
                bo.onclick = aC;
                bo.title = "Toggle SM2 debug console";
                if (au.match(/msie 6/i)) {
                    bo.style.position = "absolute";
                    bo.style.cursor = "hand"
                }
                for (bk in bl) {
                    if (bl.hasOwnProperty(bk)) {
                        bo.style[bk] = bl[bk]
                    }
                }
                bn = aa.createElement("div");
                bn.id = ao.debugID;
                bn.style.display = (ao.debugMode ? "block" : "none");
                if (ao.debugMode && !an(bo.id)) {
                    try {
                        bj = be();
                        bj.appendChild(bo)
                    } catch (bm) {
                        throw new Error(bd("domError") + " \n" + bm.toString())
                    }
                    bj.appendChild(bn)
                }
            }
            bj = null
        };
        J = this.getSoundById;
        W = function(bk, bj) {
            return (!bk ? "" : ao._wD(bd(bk), bj))
        };
        aC = function() {
            var bk = an(ao.debugID),
                bj = an(ao.debugID + "-toggle");
            if (!bk) {
                return false
            }
            if (bf) {
                bj.innerHTML = "+";
                bk.style.display = "none"
            } else {
                bj.innerHTML = "-";
                bk.style.display = "block"
            }
            bf = !bf
        };
        N = function(bm, bj, bk) {
            if (c.sm2Debugger !== d) {
                try {
                    sm2Debugger.handleEvent(bm, bj, bk)
                } catch (bl) {
                    return false
                }
            }
            return true
        };
        n = function() {
            var bj = [];
            if (ao.debugMode) {
                bj.push(F.sm2Debug)
            }
            if (ao.debugFlash) {
                bj.push(F.flashDebug)
            }
            if (ao.useHighPerformance) {
                bj.push(F.highPerf)
            }
            return bj.join(" ")
        };
        aA = function() {
            var bk = bd("fbHandler"),
                bm = ao.getMoviePercent(),
                bl = F,
                bj = {
                    type: "FLASHBLOCK"
                };
            if (ao.html5Only) {
                return false
            }
            if (!ao.ok()) {
                if (C) {
                    ao.oMC.className = n() + " " + bl.swfDefault + " " + (bm === null ? bl.swfTimedout : bl.swfError);
                    ao._wD(bk + ": " + bd("fbTimeout") + (bm ? " (" + bd("fbLoaded") + ")" : ""))
                }
                ao.didFlashBlock = true;
                aR({
                    type: "ontimeout",
                    ignoreInit: true,
                    error: bj
                });
                ab(bj)
            } else {
                if (ao.didFlashBlock) {
                    ao._wD(bk + ": Unblocked")
                }
                if (ao.oMC) {
                    ao.oMC.className = [n(), bl.swfDefault, bl.swfLoaded + (ao.didFlashBlock ? " " + bl.swfUnblocked : "")].join(" ")
                }
            }
        };
        Z = function(bl, bk, bj) {
            if (w[bl] === d) {
                w[bl] = []
            }
            w[bl].push({
                method: bk,
                scope: (bj || null),
                fired: false
            })
        };
        aR = function(bp) {
            if (!bp) {
                bp = {
                    type: (ao.ok() ? "onready" : "ontimeout")
                }
            }
            if (!ax && bp && !bp.ignoreInit) {
                return false
            }
            if (bp.type === "ontimeout" && (ao.ok() || (a0 && !bp.ignoreInit))) {
                return false
            }
            var bl = {
                    success: (bp && bp.ignoreInit ? ao.ok() : !a0)
                },
                bk = (bp && bp.type ? w[bp.type] || [] : []),
                bj = [],
                bq, bo, bn = [bl],
                bm = (C && !ao.ok());
            if (bp.error) {
                bn[0].error = bp.error
            }
            for (bq = 0, bo = bk.length; bq < bo; bq++) {
                if (bk[bq].fired !== true) {
                    bj.push(bk[bq])
                }
            }
            if (bj.length) {
                for (bq = 0, bo = bj.length; bq < bo; bq++) {
                    if (bj[bq].scope) {
                        bj[bq].method.apply(bj[bq].scope, bn)
                    } else {
                        bj[bq].method.apply(this, bn)
                    }
                    if (!bm) {
                        bj[bq].fired = true
                    }
                }
            }
            return true
        };
        t = function() {
            c.setTimeout(function() {
                if (ao.useFlashBlock) {
                    aA()
                }
                aR();
                if (typeof ao.onload === "function") {
                    W("onload", 1);
                    ao.onload.apply(c);
                    W("onloadOK", 1)
                }
                if (ao.waitForWindowLoad) {
                    al.add(c, "load", t)
                }
            }, 1)
        };
        R = function() {
            if (at !== d) {
                return at
            }
            var bj = false,
                bq = navigator,
                bm = bq.plugins,
                bp, bl, bk, bo = c.ActiveXObject;
            if (bm && bm.length) {
                bl = "application/x-shockwave-flash";
                bk = bq.mimeTypes;
                if (bk && bk[bl] && bk[bl].enabledPlugin && bk[bl].enabledPlugin.description) {
                    bj = true
                }
            } else {
                if (bo !== d && !au.match(/MSAppHost/i)) {
                    try {
                        bp = new bo("ShockwaveFlash.ShockwaveFlash")
                    } catch (bn) {
                        bp = null
                    }
                    bj = (!!bp);
                    bp = null
                }
            }
            at = bj;
            return bj
        };
        T = function() {
            var bk, bm, bj = ao.audioFormats,
                bl = (aV && !!(au.match(/os (1|2|3_0|3_1)/i)));
            if (bl) {
                ao.hasHTML5 = false;
                ao.html5Only = true;
                if (ao.oMC) {
                    ao.oMC.style.display = "none"
                }
            } else {
                if (ao.useHTML5Audio) {
                    if (!ao.html5 || !ao.html5.canPlayType) {
                        ao._wD("SoundManager: No HTML5 Audio() support detected.");
                        ao.hasHTML5 = false
                    }
                    if (a4) {
                        ao._wD(G + "Note: Buggy HTML5 Audio in Safari on this OS X release, see https://bugs.webkit.org/show_bug.cgi?id=32159 - " + (!at ? " would use flash fallback for MP3/MP4, but none detected." : "will use flash fallback for MP3/MP4, if available"), 1)
                    }
                }
            }
            if (ao.useHTML5Audio && ao.hasHTML5) {
                af = true;
                for (bm in bj) {
                    if (bj.hasOwnProperty(bm)) {
                        if (bj[bm].required) {
                            if (!ao.html5.canPlayType(bj[bm].type)) {
                                af = false;
                                bk = true
                            } else {
                                if (ao.preferFlash && (ao.flash[bm] || ao.flash[bj[bm].type])) {
                                    bk = true
                                }
                            }
                        }
                    }
                }
            }
            if (ao.ignoreFlash) {
                bk = false;
                af = true
            }
            ao.html5Only = (ao.hasHTML5 && ao.useHTML5Audio && !bk);
            return (!ao.html5Only)
        };
        ac = function(bl) {
            var bn, bk, bm = 0,
                bj;
            if (bl instanceof Array) {
                for (bn = 0, bk = bl.length; bn < bk; bn++) {
                    if (bl[bn] instanceof Object) {
                        if (ao.canPlayMIME(bl[bn].type)) {
                            bm = bn;
                            break
                        }
                    } else {
                        if (ao.canPlayURL(bl[bn])) {
                            bm = bn;
                            break
                        }
                    }
                }
                if (bl[bm].url) {
                    bl[bm] = bl[bm].url
                }
                bj = bl[bm]
            } else {
                bj = bl
            }
            return bj
        };
        aO = function(bj) {
            if (!bj._hasTimer) {
                bj._hasTimer = true;
                if (!aS && ao.html5PollingInterval) {
                    if (bc === null && L === 0) {
                        bc = setInterval(ae, ao.html5PollingInterval)
                    }
                    L++
                }
            }
        };
        O = function(bj) {
            if (bj._hasTimer) {
                bj._hasTimer = false;
                if (!aS && ao.html5PollingInterval) {
                    L--
                }
            }
        };
        ae = function() {
            var bj;
            if (bc !== null && !L) {
                clearInterval(bc);
                bc = null;
                return false
            }
            for (bj = ao.soundIDs.length - 1; bj >= 0; bj--) {
                if (ao.sounds[ao.soundIDs[bj]].isHTML5 && ao.sounds[ao.soundIDs[bj]]._hasTimer) {
                    ao.sounds[ao.soundIDs[bj]]._onTimer()
                }
            }
        };
        ab = function(bj) {
            bj = (bj !== d ? bj : {});
            if (typeof ao.onerror === "function") {
                ao.onerror.apply(c, [{
                    type: (bj.type !== d ? bj.type : null)
                }])
            }
            if (bj.fatal !== d && bj.fatal) {
                ao.disable()
            }
        };
        D = function() {
            if (!a4 || !R()) {
                return false
            }
            var bj = ao.audioFormats,
                bk, bl;
            for (bl in bj) {
                if (bj.hasOwnProperty(bl)) {
                    if (bl === "mp3" || bl === "mp4") {
                        ao._wD(aW + ": Using flash fallback for " + bl + " format");
                        ao.html5[bl] = false;
                        if (bj[bl] && bj[bl].related) {
                            for (bk = bj[bl].related.length - 1; bk >= 0; bk--) {
                                ao.html5[bj[bl].related[bk]] = false
                            }
                        }
                    }
                }
            }
        };
        this._setSandboxType = function(bj) {
            var bk = ao.sandbox;
            bk.type = bj;
            bk.description = bk.types[(bk.types[bj] !== d ? bj : "unknown")];
            if (bk.type === "localWithFile") {
                bk.noRemote = true;
                bk.noLocal = false;
                W("secNote", 2)
            } else {
                if (bk.type === "localWithNetwork") {
                    bk.noRemote = false;
                    bk.noLocal = true
                } else {
                    if (bk.type === "localTrusted") {
                        bk.noRemote = false;
                        bk.noLocal = false
                    }
                }
            }
        };
        this._externalInterfaceOK = function(bk) {
            if (ao.swfLoaded) {
                return false
            }
            var bl;
            N("swf", true);
            N("flashtojs", true);
            ao.swfLoaded = true;
            a8 = false;
            if (a4) {
                D()
            }
            if (!bk || bk.replace(/\+dev/i, "") !== ao.versionNumber.replace(/\+dev/i, "")) {
                bl = aW + ': Fatal: JavaScript file build "' + ao.versionNumber + '" does not match Flash SWF build "' + bk + '" at ' + ao.url + ". Ensure both are up-to-date.";
                setTimeout(function bj() {
                    throw new Error(bl)
                }, 0);
                return false
            }
            setTimeout(aJ, a6 ? 100 : 1)
        };
        I = function(bw, bn) {
            if (ap && aT) {
                return false
            }

            function by() {
                var bE = [],
                    bG, bF = [],
                    bD = " + ";
                bG = "SoundManager " + ao.version + (!ao.html5Only && ao.useHTML5Audio ? (ao.hasHTML5 ? " + HTML5 audio" : ", no HTML5 audio support") : "");
                if (!ao.html5Only) {
                    if (ao.preferFlash) {
                        bE.push("preferFlash")
                    }
                    if (ao.useHighPerformance) {
                        bE.push("useHighPerformance")
                    }
                    if (ao.flashPollingInterval) {
                        bE.push("flashPollingInterval (" + ao.flashPollingInterval + "ms)")
                    }
                    if (ao.html5PollingInterval) {
                        bE.push("html5PollingInterval (" + ao.html5PollingInterval + "ms)")
                    }
                    if (ao.wmode) {
                        bE.push("wmode (" + ao.wmode + ")")
                    }
                    if (ao.debugFlash) {
                        bE.push("debugFlash")
                    }
                    if (ao.useFlashBlock) {
                        bE.push("flashBlock")
                    }
                } else {
                    if (ao.html5PollingInterval) {
                        bE.push("html5PollingInterval (" + ao.html5PollingInterval + "ms)")
                    }
                }
                if (bE.length) {
                    bF = bF.concat([bE.join(bD)])
                }
                ao._wD(bG + (bF.length ? bD + bF.join(", ") : ""), 1);
                aF()
            }
            if (ao.html5Only) {
                aU();
                by();
                ao.oMC = an(ao.movieID);
                aJ();
                ap = true;
                aT = true;
                return false
            }
            var bv = (bn || ao.url),
                br = (ao.altURL || bv),
                bC = "JS/Flash audio component (SoundManager 2)",
                bu = be(),
                bt = n(),
                bj = null,
                bm = aa.getElementsByTagName("html")[0],
                bz, bo, bA, bs, bq, bp, bl, bB;
            bj = (bm && bm.dir && bm.dir.match(/rtl/i));
            bw = (bw === d ? ao.id : bw);

            function bk(bD, bE) {
                return '<param name="' + bD + '" value="' + bE + '" />'
            }
            aU();
            ao.url = az(H ? bv : br);
            bn = ao.url;
            ao.wmode = (!ao.wmode && ao.useHighPerformance ? "transparent" : ao.wmode);
            if (ao.wmode !== null && (au.match(/msie 8/i) || (!a6 && !ao.useHighPerformance)) && navigator.platform.match(/win32|win64/i)) {
                aq.push(e.spcWmode);
                ao.wmode = null
            }
            bz = {
                name: bw,
                id: bw,
                src: bn,
                quality: "high",
                allowScriptAccess: ao.allowScriptAccess,
                bgcolor: ao.bgColor,
                pluginspage: aM + "www.macromedia.com/go/getflashplayer",
                title: bC,
                type: "application/x-shockwave-flash",
                wmode: ao.wmode,
                hasPriority: "true"
            };
            if (ao.debugFlash) {
                bz.FlashVars = "debug=1"
            }
            if (!ao.wmode) {
                delete bz.wmode
            }
            if (a6) {
                bo = aa.createElement("div");
                bs = ['<object id="' + bw + '" data="' + bn + '" type="' + bz.type + '" title="' + bz.title + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="' + aM + 'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">', bk("movie", bn), bk("AllowScriptAccess", ao.allowScriptAccess), bk("quality", bz.quality), (ao.wmode ? bk("wmode", ao.wmode) : ""), bk("bgcolor", ao.bgColor), bk("hasPriority", "true"), (ao.debugFlash ? bk("FlashVars", bz.FlashVars) : ""), "</object>"].join("")
            } else {
                bo = aa.createElement("embed");
                for (bA in bz) {
                    if (bz.hasOwnProperty(bA)) {
                        bo.setAttribute(bA, bz[bA])
                    }
                }
            }
            E();
            bt = n();
            bu = be();
            if (bu) {
                ao.oMC = (an(ao.movieID) || aa.createElement("div"));
                if (!ao.oMC.id) {
                    ao.oMC.id = ao.movieID;
                    ao.oMC.className = F.swfDefault + " " + bt;
                    bp = null;
                    bq = null;
                    if (!ao.useFlashBlock) {
                        if (ao.useHighPerformance) {
                            bp = {
                                position: "fixed",
                                width: "8px",
                                height: "8px",
                                bottom: "0px",
                                left: "0px",
                                overflow: "hidden"
                            }
                        } else {
                            bp = {
                                position: "absolute",
                                width: "6px",
                                height: "6px",
                                top: "-9999px",
                                left: "-9999px"
                            };
                            if (bj) {
                                bp.left = Math.abs(parseInt(bp.left, 10)) + "px"
                            }
                        }
                    }
                    if (aG) {
                        ao.oMC.style.zIndex = 10000
                    }
                    if (!ao.debugFlash) {
                        for (bl in bp) {
                            if (bp.hasOwnProperty(bl)) {
                                ao.oMC.style[bl] = bp[bl]
                            }
                        }
                    }
                    try {
                        if (!a6) {
                            ao.oMC.appendChild(bo)
                        }
                        bu.appendChild(ao.oMC);
                        if (a6) {
                            bq = ao.oMC.appendChild(aa.createElement("div"));
                            bq.className = F.swfBox;
                            bq.innerHTML = bs
                        }
                        aT = true
                    } catch (bx) {
                        throw new Error(bd("domError") + " \n" + bx.toString())
                    }
                } else {
                    bB = ao.oMC.className;
                    ao.oMC.className = (bB ? bB + " " : F.swfDefault) + (bt ? " " + bt : "");
                    ao.oMC.appendChild(bo);
                    if (a6) {
                        bq = ao.oMC.appendChild(aa.createElement("div"));
                        bq.className = F.swfBox;
                        bq.innerHTML = bs
                    }
                    aT = true
                }
            }
            ap = true;
            by();
            return true
        };
        k = function() {
            if (ao.html5Only) {
                I();
                return false
            }
            if (ad) {
                return false
            }
            if (!ao.url) {
                W("noURL");
                return false
            }
            ad = ao.getMovie(ao.id);
            if (!ad) {
                if (!aK) {
                    I(ao.id, ao.url)
                } else {
                    if (!a6) {
                        ao.oMC.appendChild(aK)
                    } else {
                        ao.oMC.innerHTML = aj
                    }
                    aK = null;
                    ap = true
                }
                ad = ao.getMovie(ao.id)
            }
            if (typeof ao.oninitmovie === "function") {
                setTimeout(ao.oninitmovie, 1)
            }
            Q();
            return true
        };
        z = function() {
            setTimeout(bb, 1000)
        };
        bb = function() {
            var bk, bj = false;
            if (!ao.url) {
                return false
            }
            if (aQ) {
                return false
            }
            aQ = true;
            al.remove(c, "load", z);
            if (a8 && !aB) {
                W("waitFocus");
                return false
            }
            if (!ax) {
                bk = ao.getMoviePercent();
                if (bk > 0 && bk < 100) {
                    bj = true
                }
            }
            setTimeout(function() {
                bk = ao.getMoviePercent();
                if (bj) {
                    aQ = false;
                    ao._wD(bd("waitSWF"));
                    c.setTimeout(z, 1);
                    return false
                }
                if (!ax) {
                    ao._wD(aW + ": No Flash response within expected time. Likely causes: " + (bk === 0 ? "SWF load failed, " : "") + "Flash blocked or JS-Flash security error." + (ao.debugFlash ? " " + bd("checkSWF") : ""), 2);
                    if (!H && bk) {
                        W("localFail", 2);
                        if (!ao.debugFlash) {
                            W("tryDebug", 2)
                        }
                    }
                    if (bk === 0) {
                        ao._wD(bd("swf404", ao.url), 1)
                    }
                    N("flashtojs", false, ": Timed out" + H ? " (Check flash security or flash blockers)" : " (No plugin/missing SWF?)")
                }
                if (!ax && ay) {
                    if (bk === null) {
                        if (ao.useFlashBlock || ao.flashLoadTimeout === 0) {
                            if (ao.useFlashBlock) {
                                aA()
                            }
                            W("waitForever")
                        } else {
                            if (!ao.useFlashBlock && af) {
                                c.setTimeout(function() {
                                    ar(G + "useFlashBlock is false, 100% HTML5 mode is possible. Rebooting with preferFlash: false...");
                                    ao.setup({
                                        preferFlash: false
                                    }).reboot();
                                    ao.didFlashBlock = true;
                                    ao.beginDelayedInit()
                                }, 1)
                            } else {
                                W("waitForever");
                                aR({
                                    type: "ontimeout",
                                    ignoreInit: true
                                })
                            }
                        }
                    } else {
                        if (ao.flashLoadTimeout === 0) {
                            W("waitForever")
                        } else {
                            s(true)
                        }
                    }
                }
            }, ao.flashLoadTimeout)
        };
        u = function() {
            function bj() {
                al.remove(c, "focus", u)
            }
            if (aB || !a8) {
                bj();
                return true
            }
            ay = true;
            aB = true;
            W("gotFocus");
            aQ = false;
            z();
            bj();
            return true
        };
        Q = function() {
            if (aq.length) {
                ao._wD("SoundManager 2: " + aq.join(" "), 1);
                aq = []
            }
        };
        aF = function() {
            Q();
            var bk, bj = [];
            if (ao.useHTML5Audio && ao.hasHTML5) {
                for (bk in ao.audioFormats) {
                    if (ao.audioFormats.hasOwnProperty(bk)) {
                        bj.push(bk + " = " + ao.html5[bk] + (!ao.html5[bk] && C && ao.flash[bk] ? " (using flash)" : (ao.preferFlash && ao.flash[bk] && C ? " (preferring flash)" : (!ao.html5[bk] ? " (" + (ao.audioFormats[bk].required ? "required, " : "") + "and no flash support)" : ""))))
                    }
                }
                ao._wD("SoundManager 2 HTML5 support: " + bj.join(", "), 1)
            }
        };
        x = function(bm) {
            if (ax) {
                return false
            }
            if (ao.html5Only) {
                W("sm2Loaded");
                ax = true;
                t();
                N("onload", true);
                return true
            }
            var bk = (ao.useFlashBlock && ao.flashLoadTimeout && !ao.getMoviePercent()),
                bj = true,
                bl;
            if (!bk) {
                ax = true;
                if (a0) {
                    bl = {
                        type: (!at && C ? "NO_FLASH" : "INIT_TIMEOUT")
                    }
                }
            }
            ao._wD("SoundManager 2 " + (a0 ? "failed to load" : "loaded") + " (" + (a0 ? "Flash security/load error" : "OK") + ")", a0 ? 2 : 1);
            if (a0 || bm) {
                if (ao.useFlashBlock && ao.oMC) {
                    ao.oMC.className = n() + " " + (ao.getMoviePercent() === null ? F.swfTimedout : F.swfError)
                }
                aR({
                    type: "ontimeout",
                    error: bl,
                    ignoreInit: true
                });
                N("onload", false);
                ab(bl);
                bj = false
            } else {
                N("onload", true)
            }
            if (!a0) {
                if (ao.waitForWindowLoad && !ba) {
                    W("waitOnload");
                    al.add(c, "load", t)
                } else {
                    if (ao.waitForWindowLoad && ba) {
                        W("docLoaded")
                    }
                    t()
                }
            }
            return bj
        };
        A = function() {
            var bj, bk = ao.setupOptions;
            for (bj in bk) {
                if (bk.hasOwnProperty(bj)) {
                    if (ao[bj] === d) {
                        ao[bj] = bk[bj]
                    } else {
                        if (ao[bj] !== bk[bj]) {
                            ao.setupOptions[bj] = ao[bj]
                        }
                    }
                }
            }
        };
        aJ = function() {
            if (ax) {
                W("didInit");
                return false
            }

            function bj() {
                al.remove(c, "load", ao.beginDelayedInit)
            }
            if (ao.html5Only) {
                if (!ax) {
                    bj();
                    ao.enabled = true;
                    x()
                }
                return true
            }
            k();
            try {
                ad._externalInterfaceTest(false);
                m(true, (ao.flashPollingInterval || (ao.useHighPerformance ? 10 : 50)));
                if (!ao.debugMode) {
                    ad._disableDebug()
                }
                ao.enabled = true;
                N("jstoflash", true);
                if (!ao.html5Only) {
                    al.add(c, "unload", U)
                }
            } catch (bk) {
                ao._wD("js/flash exception: " + bk.toString());
                N("jstoflash", false);
                ab({
                    type: "JS_TO_FLASH_EXCEPTION",
                    fatal: true
                });
                s(true);
                x();
                return false
            }
            x();
            bj();
            return true
        };
        M = function() {
            if (q) {
                return false
            }
            q = true;
            A();
            E();
            (function() {
                var bm = "sm2-usehtml5audio=",
                    bk = "sm2-preferflash=",
                    bj = null,
                    bn = null,
                    bl = y.toLowerCase();
                if (bl.indexOf(bm) !== -1) {
                    bj = (bl.charAt(bl.indexOf(bm) + bm.length) === "1");
                    if (K) {
                        console.log((bj ? "Enabling " : "Disabling ") + "useHTML5Audio via URL parameter")
                    }
                    ao.setup({
                        useHTML5Audio: bj
                    })
                }
                if (bl.indexOf(bk) !== -1) {
                    bn = (bl.charAt(bl.indexOf(bk) + bk.length) === "1");
                    if (K) {
                        console.log((bn ? "Enabling " : "Disabling ") + "preferFlash via URL parameter")
                    }
                    ao.setup({
                        preferFlash: bn
                    })
                }
            }());
            if (!at && ao.hasHTML5) {
                ao._wD("SoundManager: No Flash detected" + (!ao.useHTML5Audio ? ", enabling HTML5." : ". Trying HTML5-only mode."), 1);
                ao.setup({
                    useHTML5Audio: true,
                    preferFlash: false
                })
            }
            aN();
            if (!at && C) {
                aq.push(e.needFlash);
                ao.setup({
                    flashLoadTimeout: 1
                })
            }
            if (aa.removeEventListener) {
                aa.removeEventListener("DOMContentLoaded", M, false)
            }
            k();
            return true
        };
        P = function() {
            if (aa.readyState === "complete") {
                M();
                aa.detachEvent("onreadystatechange", P)
            }
            return true
        };
        bi = function() {
            ba = true;
            al.remove(c, "load", bi)
        };
        aD = function() {
            if (aS) {
                if (!ao.setupOptions.useHTML5Audio || ao.setupOptions.preferFlash) {
                    aq.push(e.mobileUA)
                }
                ao.setupOptions.useHTML5Audio = true;
                ao.setupOptions.preferFlash = false;
                if (aV || (av && !au.match(/android\s2\.3/i))) {
                    aq.push(e.globalHTML5);
                    if (aV) {
                        ao.ignoreFlash = true
                    }
                    aY = true
                }
            }
        };
        aD();
        R();
        al.add(c, "focus", u);
        al.add(c, "load", z);
        al.add(c, "load", bi);
        if (aa.addEventListener) {
            aa.addEventListener("DOMContentLoaded", M, false)
        } else {
            if (aa.attachEvent) {
                aa.attachEvent("onreadystatechange", P)
            } else {
                N("onload", false);
                ab({
                    type: "NO_DOM2_EVENTS",
                    fatal: true
                })
            }
        }
    }
    if (c.SM2_DEFER === undefined || !SM2_DEFER) {
        b = new a()
    }
    c.SoundManager = a;
    c.soundManager = b
}(window));
(function(e) {
    function c(j, i, g, h, f) {
        this._listener = i;
        this._isOnce = g;
        this.context = h;
        this._signal = j;
        this._priority = f || 0
    }
    c.prototype = {
        active: true,
        params: null,
        execute: function(f) {
            var h, g;
            if (this.active && !!this._listener) {
                g = this.params ? this.params.concat(f) : f;
                h = this._listener.apply(this.context, g);
                if (this._isOnce) {
                    this.detach()
                }
            }
            return h
        },
        detach: function() {
            return this.isBound() ? this._signal.remove(this._listener, this.context) : null
        },
        isBound: function() {
            return (!!this._signal && !!this._listener)
        },
        isOnce: function() {
            return this._isOnce
        },
        getListener: function() {
            return this._listener
        },
        getSignal: function() {
            return this._signal
        },
        _destroy: function() {
            delete this._signal;
            delete this._listener;
            delete this.context
        },
        toString: function() {
            return "[SignalBinding isOnce:" + this._isOnce + ", isBound:" + this.isBound() + ", active:" + this.active + "]"
        }
    };

    function a(f, g) {
        if (typeof f !== "function") {
            throw new Error("listener is a required param of {fn}() and should be a Function.".replace("{fn}", g))
        }
    }

    function d() {
        this._bindings = [];
        this._prevParams = null;
        var f = this;
        this.dispatch = function() {
            d.prototype.dispatch.apply(f, arguments)
        }
    }
    d.prototype = {
        VERSION: "1.0.0",
        memorize: false,
        _shouldPropagate: true,
        active: true,
        _registerListener: function(j, h, i, g) {
            var f = this._indexOfListener(j, i),
                k;
            if (f !== -1) {
                k = this._bindings[f];
                if (k.isOnce() !== h) {
                    throw new Error("You cannot add" + (h ? "" : "Once") + "() then add" + (!h ? "" : "Once") + "() the same listener without removing the relationship first.")
                }
            } else {
                k = new c(this, j, h, i, g);
                this._addBinding(k)
            }
            if (this.memorize && this._prevParams) {
                k.execute(this._prevParams)
            }
            return k
        },
        _addBinding: function(f) {
            var g = this._bindings.length;
            do {
                --g
            } while (this._bindings[g] && f._priority <= this._bindings[g]._priority);
            this._bindings.splice(g + 1, 0, f)
        },
        _indexOfListener: function(g, f) {
            var i = this._bindings.length,
                h;
            while (i--) {
                h = this._bindings[i];
                if (h._listener === g && h.context === f) {
                    return i
                }
            }
            return -1
        },
        has: function(g, f) {
            return this._indexOfListener(g, f) !== -1
        },
        add: function(h, g, f) {
            a(h, "add");
            return this._registerListener(h, false, g, f)
        },
        addOnce: function(h, g, f) {
            a(h, "addOnce");
            return this._registerListener(h, true, g, f)
        },
        remove: function(h, g) {
            a(h, "remove");
            var f = this._indexOfListener(h, g);
            if (f !== -1) {
                this._bindings[f]._destroy();
                this._bindings.splice(f, 1)
            }
            return h
        },
        removeAll: function() {
            var f = this._bindings.length;
            while (f--) {
                this._bindings[f]._destroy()
            }
            this._bindings.length = 0
        },
        getNumListeners: function() {
            return this._bindings.length
        },
        halt: function() {
            this._shouldPropagate = false
        },
        dispatch: function(g) {
            if (!this.active) {
                return
            }
            var f = Array.prototype.slice.call(arguments),
                i = this._bindings.length,
                h;
            if (this.memorize) {
                this._prevParams = f
            }
            if (!i) {
                return
            }
            h = this._bindings.slice();
            this._shouldPropagate = true;
            do {
                i--
            } while (h[i] && this._shouldPropagate && h[i].execute(f) !== false)
        },
        forget: function() {
            this._prevParams = null
        },
        dispose: function() {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams
        },
        toString: function() {
            return "[Signal active:" + this.active + " numListeners:" + this.getNumListeners() + "]"
        }
    };
    var b = d;
    b.Signal = d;
    if (typeof define === "function" && define.amd) {
        define(function() {
            return b
        })
    } else {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = b
        } else {
            e.signals = b
        }
    }
}(this));
(function() {
    var b = "0.4.3",
        x = window.jQuery || window.$ || (window.$ = {}),
        f = {
            parse: window.JSON && (window.JSON.parse || window.JSON.decode) || String.prototype.evalJSON && function(K) {
                return String(K).evalJSON()
            } || x.parseJSON || x.evalJSON,
            stringify: Object.toJSON || window.JSON && (window.JSON.stringify || window.JSON.encode) || x.toJSON
        };
    if (!f.parse || !f.stringify) {
        throw new Error("No JSON support found, include //cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.js to page")
    }
    var e = {
            __jstorage_meta: {
                CRC32: {}
            }
        },
        A = {
            jStorage: "{}"
        },
        p = null,
        I = 0,
        F = false,
        i = {},
        G = false,
        z = 0,
        g = {},
        m = +new Date(),
        h, v = {
            isXML: function(L) {
                var K = (L ? L.ownerDocument || L : 0).documentElement;
                return K ? K.nodeName !== "HTML" : false
            },
            encode: function(L) {
                if (!this.isXML(L)) {
                    return false
                }
                try {
                    return new XMLSerializer().serializeToString(L)
                } catch (K) {
                    try {
                        return L.xml
                    } catch (M) {}
                }
                return false
            },
            decode: function(L) {
                var K = ("DOMParser" in window && (new DOMParser()).parseFromString) || (window.ActiveXObject && function(N) {
                        var O = new ActiveXObject("Microsoft.XMLDOM");
                        O.async = "false";
                        O.loadXML(N);
                        return O
                    }),
                    M;
                if (!K) {
                    return false
                }
                M = K.call("DOMParser" in window && (new DOMParser()) || window, L, "text/xml");
                return this.isXML(M) ? M : false
            }
        };

    function D() {
        var K = false;
        if ("localStorage" in window) {
            try {
                window.localStorage.setItem("_tmptest", "tmpval");
                K = true;
                window.localStorage.removeItem("_tmptest")
            } catch (L) {}
        }
        if (K) {
            try {
                if (window.localStorage) {
                    A = window.localStorage;
                    F = "localStorage";
                    z = A.jStorage_update
                }
            } catch (R) {}
        } else {
            if ("globalStorage" in window) {
                try {
                    if (window.globalStorage) {
                        if (window.location.hostname == "localhost") {
                            A = window.globalStorage["localhost.localdomain"]
                        } else {
                            A = window.globalStorage[window.location.hostname]
                        }
                        F = "globalStorage";
                        z = A.jStorage_update
                    }
                } catch (Q) {}
            } else {
                p = document.createElement("link");
                if (p.addBehavior) {
                    p.style.behavior = "url(#default#userData)";
                    document.getElementsByTagName("head")[0].appendChild(p);
                    try {
                        p.load("jStorage")
                    } catch (P) {
                        p.setAttribute("jStorage", "{}");
                        p.save("jStorage");
                        p.load("jStorage")
                    }
                    var O = "{}";
                    try {
                        O = p.getAttribute("jStorage")
                    } catch (N) {}
                    try {
                        z = p.getAttribute("jStorage_update")
                    } catch (M) {}
                    A.jStorage = O;
                    F = "userDataBehavior"
                } else {
                    p = null;
                    return
                }
            }
        }
        c();
        s();
        d();
        B();
        if ("addEventListener" in window) {
            window.addEventListener("pageshow", function(S) {
                if (S.persisted) {
                    n()
                }
            }, false)
        }
    }

    function r() {
        var M = "{}";
        if (F == "userDataBehavior") {
            p.load("jStorage");
            try {
                M = p.getAttribute("jStorage")
            } catch (L) {}
            try {
                z = p.getAttribute("jStorage_update")
            } catch (K) {}
            A.jStorage = M
        }
        c();
        s();
        B()
    }

    function d() {
        if (F == "localStorage" || F == "globalStorage") {
            if ("addEventListener" in window) {
                window.addEventListener("storage", n, false)
            } else {
                document.attachEvent("onstorage", n)
            }
        } else {
            if (F == "userDataBehavior") {
                setInterval(n, 1000)
            }
        }
    }

    function n() {
        var K;
        clearTimeout(G);
        G = setTimeout(function() {
            if (F == "localStorage" || F == "globalStorage") {
                K = A.jStorage_update
            } else {
                if (F == "userDataBehavior") {
                    p.load("jStorage");
                    try {
                        K = p.getAttribute("jStorage_update")
                    } catch (L) {}
                }
            }
            if (K && K != z) {
                z = K;
                l()
            }
        }, 25)
    }

    function l() {
        var K = f.parse(f.stringify(e.__jstorage_meta.CRC32)),
            O;
        r();
        O = f.parse(f.stringify(e.__jstorage_meta.CRC32));
        var M, L = [],
            N = [];
        for (M in K) {
            if (K.hasOwnProperty(M)) {
                if (!O[M]) {
                    N.push(M);
                    continue
                }
                if (K[M] != O[M] && String(K[M]).substr(0, 2) == "2.") {
                    L.push(M)
                }
            }
        }
        for (M in O) {
            if (O.hasOwnProperty(M)) {
                if (!K[M]) {
                    L.push(M)
                }
            }
        }
        J(L, "updated");
        J(N, "deleted")
    }

    function J(P, Q) {
        P = [].concat(P || []);
        if (Q == "flushed") {
            P = [];
            for (var O in i) {
                if (i.hasOwnProperty(O)) {
                    P.push(O)
                }
            }
            Q = "deleted"
        }
        for (var N = 0, K = P.length; N < K; N++) {
            if (i[P[N]]) {
                for (var M = 0, L = i[P[N]].length; M < L; M++) {
                    i[P[N]][M](P[N], Q)
                }
            }
            if (i["*"]) {
                for (var M = 0, L = i["*"].length; M < L; M++) {
                    i["*"][M](P[N], Q)
                }
            }
        }
    }

    function w() {
        var K = (+new Date()).toString();
        if (F == "localStorage" || F == "globalStorage") {
            A.jStorage_update = K
        } else {
            if (F == "userDataBehavior") {
                p.setAttribute("jStorage_update", K);
                p.save("jStorage")
            }
        }
        n()
    }

    function c() {
        if (A.jStorage) {
            try {
                e = f.parse(String(A.jStorage))
            } catch (K) {
                A.jStorage = "{}"
            }
        } else {
            A.jStorage = "{}"
        }
        I = A.jStorage ? String(A.jStorage).length : 0;
        if (!e.__jstorage_meta) {
            e.__jstorage_meta = {}
        }
        if (!e.__jstorage_meta.CRC32) {
            e.__jstorage_meta.CRC32 = {}
        }
    }
    var j = false;
    var o = 1000;

    function q() {
        var L;
        E();
        try {
            L = new Date();
            A.jStorage = f.stringify(e);
            L = new Date() - L;
            if (L > o && !j && window.TS && TS.logError) {
                j = true;
                TS.logError({
                    message: "jstorage: _save > " + o + " ms"
                }, " took " + L + " ms to JSON.stringify " + A.jStorage.length + " chars.")
            }
            if (p) {
                p.setAttribute("jStorage", A.jStorage);
                p.save("jStorage")
            }
            I = A.jStorage ? String(A.jStorage).length : 0
        } catch (K) {}
    }

    function u(K) {
        if (!K || (typeof K != "string" && typeof K != "number")) {
            throw new TypeError("Key name must be string or numeric")
        }
        if (K == "__jstorage_meta") {
            throw new TypeError("Reserved key name")
        }
        return true
    }

    function s() {
        var Q, L, O, M, N = Infinity,
            P = false,
            K = [];
        clearTimeout(h);
        if (!e.__jstorage_meta || typeof e.__jstorage_meta.TTL != "object") {
            return
        }
        Q = +new Date();
        O = e.__jstorage_meta.TTL;
        M = e.__jstorage_meta.CRC32;
        for (L in O) {
            if (O.hasOwnProperty(L)) {
                if (O[L] <= Q) {
                    delete O[L];
                    delete M[L];
                    delete e[L];
                    P = true;
                    K.push(L)
                } else {
                    if (O[L] < N) {
                        N = O[L]
                    }
                }
            }
        }
        if (N != Infinity) {
            h = setTimeout(s, N - Q)
        }
        if (P) {
            q();
            w();
            J(K, "deleted")
        }
    }

    function B() {
        var N, L;
        if (!e.__jstorage_meta.PubSub) {
            return
        }
        var K, M = m;
        for (N = L = e.__jstorage_meta.PubSub.length - 1; N >= 0; N--) {
            K = e.__jstorage_meta.PubSub[N];
            if (K[0] > m) {
                M = K[0];
                k(K[1], K[2])
            }
        }
        m = M
    }

    function k(M, N) {
        if (g[M]) {
            for (var L = 0, K = g[M].length; L < K; L++) {
                g[M][L](M, f.parse(f.stringify(N)))
            }
        }
    }

    function E() {
        if (!e.__jstorage_meta.PubSub) {
            return
        }
        var M = +new Date() - 2000;
        for (var L = 0, K = e.__jstorage_meta.PubSub.length; L < K; L++) {
            if (e.__jstorage_meta.PubSub[L][0] <= M) {
                e.__jstorage_meta.PubSub.splice(L, e.__jstorage_meta.PubSub.length - L);
                break
            }
        }
        if (!e.__jstorage_meta.PubSub.length) {
            delete e.__jstorage_meta.PubSub
        }
    }

    function C(K, L) {
        if (!e.__jstorage_meta) {
            e.__jstorage_meta = {}
        }
        if (!e.__jstorage_meta.PubSub) {
            e.__jstorage_meta.PubSub = []
        }
        e.__jstorage_meta.PubSub.unshift([+new Date, K, L]);
        q();
        w()
    }

    function y(P, L) {
        var K = P.length,
            O = L ^ K,
            N = 0,
            M;
        while (K >= 4) {
            M = ((P.charCodeAt(N) & 255)) | ((P.charCodeAt(++N) & 255) << 8) | ((P.charCodeAt(++N) & 255) << 16) | ((P.charCodeAt(++N) & 255) << 24);
            M = (((M & 65535) * 1540483477) + ((((M >>> 16) * 1540483477) & 65535) << 16));
            M ^= M >>> 24;
            M = (((M & 65535) * 1540483477) + ((((M >>> 16) * 1540483477) & 65535) << 16));
            O = (((O & 65535) * 1540483477) + ((((O >>> 16) * 1540483477) & 65535) << 16)) ^ M;
            K -= 4;
            ++N
        }
        switch (K) {
            case 3:
                O ^= (P.charCodeAt(N + 2) & 255) << 16;
            case 2:
                O ^= (P.charCodeAt(N + 1) & 255) << 8;
            case 1:
                O ^= (P.charCodeAt(N) & 255);
                O = (((O & 65535) * 1540483477) + ((((O >>> 16) * 1540483477) & 65535) << 16))
        }
        O ^= O >>> 13;
        O = (((O & 65535) * 1540483477) + ((((O >>> 16) * 1540483477) & 65535) << 16));
        O ^= O >>> 15;
        return O >>> 0
    }
    var H = false;
    var t = 1000;
    var a = {
        version: b,
        set: function(N, O, L) {
            u(N);
            L = L || {};
            if (typeof O == "undefined") {
                this.deleteKey(N);
                return O
            }
            var Q = new Date();
            var M;
            var K = "string";
            var P;
            M = new Date();
            if (v.isXML(O)) {
                O = {
                    _is_xml: true,
                    xml: v.encode(O)
                };
                K = "xml"
            } else {
                if (typeof O == "function") {
                    return undefined
                } else {
                    if (O && typeof O == "object") {
                        K = "JSON parse + stringify";
                        O = f.parse(f.stringify(O))
                    }
                }
            }
            K += ": " + (new Date() - M) + " ms";
            e[N] = O;
            M = new Date();
            e.__jstorage_meta.CRC32[N] = "2." + y(f.stringify(O), 2538058380);
            K += " murmurhash: " + (new Date() - M) + " ms";
            M = new Date();
            this.setTTL(N, L.TTL || 0);
            K += " setTTL: " + N + ", length = " + (O && O.length ? O.length : "unknown") + ": write = " + (new Date() - M) + " ms";
            M = new Date();
            J(N, "updated");
            K += " _fireObservers: " + (new Date() - M) + " ms";
            P = new Date() - Q;
            if (P > t && !H && window.TS && TS.logError) {
                H = true;
                TS.logError({
                    message: "jstorage.set > " + t + " ms"
                }, "duration: " + P + " ms. " + K)
            }
            return O
        },
        get: function(K, L) {
            u(K);
            if (K in e) {
                if (e[K] && typeof e[K] == "object" && e[K]._is_xml) {
                    return v.decode(e[K].xml)
                } else {
                    return e[K]
                }
            }
            return typeof(L) == "undefined" ? null : L
        },
        deleteKey: function(K) {
            u(K);
            if (K in e) {
                delete e[K];
                if (typeof e.__jstorage_meta.TTL == "object" && K in e.__jstorage_meta.TTL) {
                    delete e.__jstorage_meta.TTL[K]
                }
                delete e.__jstorage_meta.CRC32[K];
                q();
                w();
                J(K, "deleted");
                return true
            }
            return false
        },
        setTTL: function(L, K) {
            var M = +new Date();
            u(L);
            K = Number(K) || 0;
            if (L in e) {
                if (!e.__jstorage_meta.TTL) {
                    e.__jstorage_meta.TTL = {}
                }
                if (K > 0) {
                    e.__jstorage_meta.TTL[L] = M + K
                } else {
                    delete e.__jstorage_meta.TTL[L]
                }
                q();
                s();
                w();
                return true
            }
            return false
        },
        getTTL: function(L) {
            var M = +new Date(),
                K;
            u(L);
            if (L in e && e.__jstorage_meta.TTL && e.__jstorage_meta.TTL[L]) {
                K = e.__jstorage_meta.TTL[L] - M;
                return K || 0
            }
            return 0
        },
        flush: function() {
            e = {
                __jstorage_meta: {
                    CRC32: {}
                }
            };
            q();
            w();
            J(null, "flushed");
            return true
        },
        storageObj: function() {
            function K() {}
            K.prototype = e;
            return new K()
        },
        index: function() {
            var K = [],
                L;
            for (L in e) {
                if (e.hasOwnProperty(L) && L != "__jstorage_meta") {
                    K.push(L)
                }
            }
            return K
        },
        storageSize: function() {
            return I
        },
        currentBackend: function() {
            return F
        },
        storageAvailable: function() {
            return !!F
        },
        listenKeyChange: function(K, L) {
            u(K);
            if (!i[K]) {
                i[K] = []
            }
            i[K].push(L)
        },
        stopListening: function(L, M) {
            u(L);
            if (!i[L]) {
                return
            }
            if (!M) {
                delete i[L];
                return
            }
            for (var K = i[L].length - 1; K >= 0; K--) {
                if (i[L][K] == M) {
                    i[L].splice(K, 1)
                }
            }
        },
        subscribe: function(K, L) {
            K = (K || "").toString();
            if (!K) {
                throw new TypeError("Channel not defined")
            }
            if (!g[K]) {
                g[K] = []
            }
            g[K].push(L)
        },
        publish: function(K, L) {
            K = (K || "").toString();
            if (!K) {
                throw new TypeError("Channel not defined")
            }
            C(K, L)
        },
        reInit: function() {
            r()
        }
    };
    if (!(window.location.href.toString().match(/oldstorage/i))) {
        x.jStorage_legacy = a
    } else {
        x.jStorage = a
    }
    D()
})();
if (!(window.location.href.toString().match(/oldstorage/i))) {
    (function(a, c) {
        var e = false;
        var b = false;
        var d = 1000;
        if (typeof define === "function" && define.amd) {
            define(c)
        } else {
            a.simpleStorage = c();
            if (!a.$) {
                a.$ = {}
            }
            if (!a.$.jStorage) {
                a.$.jStorage = {
                    storageAvailable: a.simpleStorage.canUse,
                    storageSize: a.simpleStorage.storageSize,
                    currentBackend: function() {
                        return (a.simpleStorage.canUse() ? "localStorage" : false)
                    },
                    flush: function() {
                        var f, i, g;
                        if (!b) {
                            i = new Date().getTime();
                            try {
                                g = window.localStorage.length
                            } catch (h) {
                                g = "unknown"
                            }
                        }
                        f = a.simpleStorage.flush();
                        if (!b) {
                            i = new Date() - i;
                            if (i > d && window.TS && TS.logError) {
                                b = true;
                                try {
                                    TS.logError({
                                        message: "simpleStorage.flush() > " + d + " ms"
                                    }, " took " + i + " ms. localStorage.length = " + g)
                                } catch (h) {}
                            }
                        }
                        return f
                    },
                    index: function() {
                        return a.simpleStorage.index.apply(a.simpleStorage, arguments)
                    },
                    deleteKey: function() {
                        return a.simpleStorage.deleteKey.apply(a.simpleStorage, arguments)
                    },
                    get: a.simpleStorage.get,
                    set: function() {
                        var f, h;
                        if (!e) {
                            h = new Date()
                        }
                        f = a.simpleStorage.set.apply(a.simpleStorage, arguments);
                        if (!e) {
                            h = new Date() - h;
                            if (h > d && window.TS && TS.logError) {
                                e = true;
                                try {
                                    TS.logError({
                                        message: "simpleStorage.set() > " + d + " ms"
                                    }, " took " + h + " ms to save key " + arguments[0] + " (" + (JSON.stringify(arguments[1])).length + " chars.) storageSize = " + _get_storage_size())
                                } catch (g) {}
                            }
                        }
                        return f
                    }
                };
                (function() {
                    var q, o, h, g, t, p, n = [],
                        r, f, m;
                    m = 0;
                    if (a.simpleStorage.canUse() && localStorage && localStorage.length) {
                        f = new Date().getTime();
                        for (q = 0, o = localStorage.length; q < o; q++) {
                            t = localStorage.key(q);
                            if (t && t === "jStorage") {
                                if ($.jStorage_legacy) {
                                    p = $.jStorage_legacy.index();
                                    for (h = 0, g = p.length; h < g; h++) {
                                        n.push($.jStorage_legacy.get(p[h]))
                                    }
                                    $.jStorage_legacy.flush();
                                    if (localStorage && localStorage.removeItem) {
                                        localStorage.removeItem("jStorage");
                                        localStorage.removeItem("jStorage_update")
                                    }
                                    for (h = 0, g = p.length; h < g; h++) {
                                        if (p[h] && !p[h].match(/channel_msgs_|oldest_ts_/i)) {
                                            $.jStorage.set(p[h], n[h]);
                                            m++
                                        }
                                    }
                                }
                            }
                        }
                        f = new Date().getTime() - f;
                        if (f > d) {
                            try {
                                r = $.jStorage.storageSize()
                            } catch (s) {
                                r = "unknown"
                            }
                            window.setTimeout(function() {
                                if (window.TS && TS.logError) {
                                    TS.logError({
                                        message: "jstorage: migration > " + d + " msec."
                                    }, "Migration took " + f + " msec. " + o + " legacy items, " + m + " new items written. Storage size: " + r)
                                }
                            }, 10000)
                        }
                    }
                }())
            }
        }
    }(this, function() {
        var w = "0.1.2.slack",
            i = false,
            s = false,
            p = "_ts_",
            j = "_ts_ttl_",
            o = -1,
            n = 5000,
            a, f = 1000 * 60 * 24 * 7,
            c = false,
            t = 1000;
        var d;

        function g(A) {
            if (!i) {
                return false
            }
            var B, C;
            C = [];
            for (B in i) {
                if (i.hasOwnProperty(B)) {
                    if (!A && p && B.indexOf(p) === 0 && B.indexOf(j) === -1) {
                        B = B.substr(p.length)
                    }
                    C.push(B)
                }
            }
            return C
        }

        function z() {
            var A = 0;
            k(function(B, C) {
                A += C.length
            });
            return A
        }

        function u(A) {
            return j + A.substr(p.length)
        }

        function m() {
            return ((new Date().getTime()) + f)
        }

        function y() {
            var C, A, D, B;
            D = g(true);
            for (C = 0, A = D.length; C < A; C++) {
                B = D[C];
                if (B !== undefined && B.indexOf(j) === -1) {
                    if (r(B) && i[B] !== undefined) {
                        delete i[B];
                        v(B)
                    }
                }
            }
        }

        function r(B) {
            var A, E, D, C;
            C = true;
            if (B && B.indexOf(p) === 0 && B.indexOf(j) === -1) {
                E = u(B);
                if (i[E] !== undefined) {
                    D = parseInt(i[E], 10);
                    if (D === o) {
                        C = false
                    } else {
                        A = (new Date().getTime());
                        if (D > A) {
                            C = false
                        }
                    }
                }
            }
            return C
        }

        function k(F, E) {
            var B, A, D, C;
            C = window.localStorage;
            for (B = 0, A = C.length; B < A; B++) {
                D = C.key(B);
                if (D !== undefined && D.indexOf && D.indexOf(p) === 0 && D.indexOf(j) === -1) {
                    if (E) {
                        F(D)
                    } else {
                        F(D, C.getItem(D))
                    }
                }
            }
        }

        function h() {
            var A, C;
            i = {};
            try {
                k(function(D, E) {
                    if (D !== undefined) {
                        A = JSON.parse(E);
                        i[D] = A;
                        C = u(D);
                        if (C) {
                            i[C] = window.localStorage.getItem(C)
                        }
                    }
                });
                y()
            } catch (B) {
                i = {}
            }
        }

        function v(B, A) {
            var D, F;
            D = localStorage;
            if (B) {
                try {
                    if (B.indexOf(j) === -1) {
                        F = u(B)
                    }
                    if (i[B] === undefined || i[B] === null) {
                        D.removeItem(B);
                        if (F) {
                            D.removeItem(F)
                        }
                    } else {
                        D.setItem(B, JSON.stringify(i[B]));
                        if (F) {
                            if (F.match(/storage_version|storage_msgs_version/i)) {
                                A = o
                            }
                            if (A) {
                                i[F] = A
                            } else {
                                if (i[F] !== o) {
                                    i[F] = m()
                                }
                            }
                            D.setItem(F, i[F])
                        }
                    }
                } catch (C) {
                    if (C.code && (C.code === 22 || C.code === 1014)) {
                        if (!d && window.TS && TS.logError) {
                            d = true;
                            TS.logError({
                                message: "jstorage: _save_key() failed."
                            }, " Error code: " + C.code + ", key: " + B + ", length: " + JSON.stringify(i[B]).length + ", localStorage size: " + z())
                        }
                    }
                    return C
                }
            }
            return true
        }

        function x(A) {
            if (A && A.indexOf(p) !== 0) {
                A = p + A
            }
            return A
        }

        function e() {
            var A;
            if (!a) {
                a = window.setTimeout(function() {
                    a = null;
                    A = new Date();
                    try {
                        h()
                    } catch (B) {
                        s = false;
                        return
                    }
                    A = new Date() - A;
                    if (A > t && !c && window.TS && window.TS.logError) {
                        c = true;
                        try {
                            TS.logError({
                                message: "simpleStorage: _reloadData() > " + t + " ms"
                            }, " took " + A + " ms. localStorage size: " + $.jStorage.storageSize())
                        } catch (C) {}
                    }
                }, n)
            }
        }

        function b() {
            if (window.addEventListener) {
                window.addEventListener("storage", e, false)
            } else {
                document.attachEvent("onstorage", e)
            }
        }

        function l() {
            window.localStorage.setItem("__simpleStorageInitTest", "tmpval");
            window.localStorage.removeItem("__simpleStorageInitTest");
            h();
            b();
            if (window.addEventListener) {
                window.addEventListener("pageshow", function(A) {
                    if (A.persisted) {
                        e()
                    }
                }, false)
            }
            s = true
        }
        try {
            l()
        } catch (q) {
            s = false
        }
        return {
            version: w,
            canUse: function() {
                return !!s
            },
            set: function(A, C) {
                if (!i) {
                    return false
                }
                A = x(A);
                if (C === undefined) {
                    return this.deleteKey(A)
                }
                try {
                    C = JSON.parse(JSON.stringify(C))
                } catch (B) {
                    return B
                }
                if (i[A] !== C) {
                    i[A] = C;
                    return v(A)
                } else {
                    return true
                }
                return v(A)
            },
            get: function(B, A) {
                if (!i || !B) {
                    return A
                }
                B = x(B);
                if (i.hasOwnProperty(B)) {
                    return i[B]
                }
                return A
            },
            deleteKey: function(A) {
                if (!i || !A) {
                    return false
                }
                A = x(A);
                if (i[A] !== undefined) {
                    delete i[A];
                    return v(A)
                }
                return false
            },
            flush: function() {
                var F = localStorage,
                    C, B, A;
                if (!i) {
                    return false
                }
                C = this.index(true);
                i = {};
                try {
                    for (B = 0, A = C.length; B < A; B++) {
                        F.removeItem(C[B])
                    }
                    return true
                } catch (D) {
                    return D
                }
            },
            index: function(A) {
                return g(A)
            },
            storageSize: function() {
                return z()
            }
        }
    }))
}(function(window, True, False, Null, undefined) {
    var document = window.document,
        documentElement = document.documentElement,
        windowHistory = window.history || {},
        windowLocation = window.location,
        api = !!windowHistory.pushState,
        initialState = api && windowHistory.state === undefined,
        initialFire = windowLocation.href,
        JSON = window.JSON || {},
        defineProp = Object.defineProperty,
        defineGetter = Object.prototype.__defineGetter__,
        defineSetter = Object.prototype.__defineSetter__,
        historyPushState = windowHistory.pushState,
        historyReplaceState = windowHistory.replaceState,
        sessionStorage = window.sessionStorage,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        msie = +(((window.eval && eval("/*@cc_on 1;@*/") && /msie (\d+)/i.exec(navigator.userAgent)) || [])[1] || 0),
        libID = (new Date()).getTime(),
        VBInc = (defineProp || defineGetter) && (!msie || msie > 8) ? 0 : 1,
        iframe = msie < 8 ? document.createElement("iframe") : False,
        _a, _r, _d, eventPrefix = "",
        addEvent = (_a = "addEventListener", window[_a]) || (_a = "attachEvent", eventPrefix = "on", window[_a]),
        removeEvent = (_r = "removeEventListener", window[_r]) || (_r = "detachEvent", window[_r]),
        fireEvent = (_d = "dispatchEvent", window[_d]) || (_d = "fireEvent", window[_d]),
        eventsListPopState = [],
        eventsListHashChange = [],
        skipHashChange = 0,
        eventsList = {
            onpopstate: eventsListPopState,
            popstate: eventsListPopState,
            onhashchange: eventsListHashChange,
            hashchange: eventsListHashChange
        },
        sets = (function() {
            var i, m, s, config = {
                    basepath: "/",
                    redirect: 0,
                    type: "/"
                },
                el = document.getElementsByTagName("SCRIPT");
            for (i = 0; el[i]; i++) {
                if (m = /(.*)\/(?:history|spike)(?:\.iegte8)?(?:-\d\.\d(?:\.\d)?\w?)?(?:\.min)?.js\?(.*)$/i.exec(el[i].src) || (i === el.length - 1 && (m = el[i].src.split("?")).length === 2 && (m[2] = m[1]) && m)) {
                    for (i = 0, s = m[2].split("&"); s[i];) {
                        m = s[i++].split("=");
                        config[m[0]] = m[1] == "true" ? True : m[1] == "false" ? False : m[1] || ""
                    }
                    config.basepath = config.basepath || "/";
                    break
                }
            }
            return config
        })(),
        normalizeUrl = (function(a) {
            var _href, relative, special, nohash, host, port, pathname;
            return function(href, test) {
                var re = new RegExp("^" + sets.basepath, "i");
                if (!href) {
                    href = windowLocation.href;
                    if (!api || test) {
                        href = windowLocation.protocol + "//" + windowLocation.host + sets.basepath + (href.replace(/^[^#]*/, "") || "#").replace(new RegExp("^#[/]?(?:" + sets.type + ")?"), "")
                    }
                } else {
                    if (!api || msie) {
                        var current = normalizeUrl(),
                            _pathname = current._pathname,
                            _protocol = current._protocol;
                        href = /^(?:[\w0-9]+\:)?\/\//.test(href) ? href.indexOf("/") === 0 ? _protocol + href : href : _protocol + "//" + current._host + (href.indexOf("/") === 0 ? href : href.indexOf("?") === 0 ? _pathname + href : href.indexOf("#") === 0 ? _pathname + current._search + href : _pathname.replace(/[^\/]+$/g, "") + href)
                    }
                }
                if (_href !== href) {
                    a.href = _href = href;
                    port = a.port;
                    host = a.host;
                    pathname = a.pathname;
                    if ((a.protocol === "http:" && port == 80) || (a.protocol === "https:" && port == 443)) {
                        host = a.hostname;
                        port = ""
                    }
                    pathname = pathname.indexOf("/") === 0 ? pathname : "/" + pathname;
                    relative = pathname + a.search + a.hash;
                    nohash = pathname.replace(re, sets.type) + a.search;
                    special = nohash + a.hash
                }
                return {
                    _href: a.protocol + "//" + host + relative,
                    _protocol: a.protocol,
                    _host: host,
                    _hostname: a.hostname || windowLocation.hostname,
                    _port: port || windowLocation.port,
                    _pathname: pathname,
                    _search: a.search,
                    _hash: a.hash,
                    _relative: relative,
                    _nohash: nohash,
                    _special: special
                }
            }
        })(document.createElement("a")),
        History = !VBInc ? windowHistory : {
            back: windowHistory.back,
            forward: windowHistory.forward,
            go: windowHistory.go,
            pushState: Null,
            replaceState: Null,
            emulate: !api,
            toString: function() {
                return "[object History]"
            }
        },
        HistoryAccessors = {
            state: {
                get: function() {
                    return iframe && iframe.storage || historyStorage()[History.location.href] || Null
                }
            },
            length: {
                get: function() {
                    return windowHistory.length
                }
            },
            location: {
                set: function(val) {
                    window.location = val
                },
                get: function() {
                    return api ? windowLocation : Location
                }
            }
        },
        Location = {
            assign: function(url) {
                windowLocation.assign(api || url.indexOf("#") !== 0 ? url : "#" + normalizeUrl()._nohash + url)
            },
            reload: windowLocation.reload,
            replace: function(url) {
                windowLocation.replace(api || url.indexOf("#") !== 0 ? url : "#" + normalizeUrl()._nohash + url)
            },
            toString: function() {
                return this.href
            }
        },
        LocationAccessors = {
            href: {
                set: function(val) {
                    windowLocation.href = val
                },
                get: function() {
                    return normalizeUrl()._href
                }
            },
            protocol: {
                set: function(val) {
                    windowLocation.protocol = val
                },
                get: function() {
                    return windowLocation.protocol
                }
            },
            host: {
                set: function(val) {
                    windowLocation.host = val
                },
                get: function() {
                    return windowLocation.host
                }
            },
            hostname: {
                set: function(val) {
                    windowLocation.hostname = val
                },
                get: function() {
                    return windowLocation.hostname
                }
            },
            port: {
                set: function(val) {
                    windowLocation.port = val
                },
                get: function() {
                    return windowLocation.port
                }
            },
            pathname: {
                set: function(val) {
                    windowLocation.pathname = val
                },
                get: function() {
                    return normalizeUrl()._pathname
                }
            },
            search: {
                set: function(val) {
                    windowLocation.search = val
                },
                get: function() {
                    return normalizeUrl()._search
                }
            },
            hash: {
                set: function(val) {
                    var hash = (val.indexOf("#") === 0 ? val : "#" + val),
                        urlObject = normalizeUrl();
                    if (iframe) {
                        if (hash != urlObject._hash) {
                            History.pushState(Null, Null, urlObject._nohash + hash);
                            hashChanged({
                                oldURL: urlObject._href
                            })
                        }
                    } else {
                        windowLocation.hash = "#" + urlObject._nohash + hash
                    }
                },
                get: function() {
                    return normalizeUrl()._hash
                }
            }
        },
        createStaticObject = function(obj, props, novb) {
            var tmp = obj,
                key, vb = False;
            if (defineProp || defineGetter) {
                for (key in props) {
                    if (hasOwnProperty.call(props, key)) {
                        if (defineGetter) {
                            props[key].get && defineGetter.call(obj, key, props[key].get);
                            props[key].set && defineSetter.call(obj, key, props[key].set)
                        } else {
                            if (defineProp) {
                                try {
                                    defineProp(obj, key, props[key])
                                } catch (_e_) {
                                    if (novb) {
                                        return False
                                    }
                                    vb = True;
                                    break
                                }
                            }
                        }
                    }
                }
            } else {
                vb = True
            }
            if (vb && VBInc) {
                var staticClass = "StaticClass" + libID + VBInc++,
                    parts = ["Class " + staticClass];
                if (!("execVB" in window)) {
                    execScript("Function execVB(c) ExecuteGlobal(c) End Function", "VBScript")
                }
                if (!("VBCVal" in window)) {
                    execScript("Function VBCVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function", "VBScript")
                }
                for (key in obj) {
                    parts[parts.length] = "Public [" + key + "]"
                }
                if (hasOwnProperty.call(obj, "toString")) {
                    if (!obj.propertyIsEnumerable("toString")) {
                        parts[parts.length] = "Public [toString]"
                    }
                    props["(toString)"] = {
                        get: function() {
                            return this.toString.call(this)
                        }
                    }
                }
                for (key in props) {
                    if (hasOwnProperty.call(props, key)) {
                        if (props[key].get) {
                            obj["get " + key] = props[key].get;
                            parts.push("Public [get " + key + "]", "Public " + (key === "(toString)" ? "Default " : "") + "Property Get [" + key + "]", "Call VBCVal(me.[get " + key + "].call(me),[" + key + "])", "End Property")
                        }
                        if (props[key].set) {
                            obj["set " + key] = props[key].set;
                            parts.push("Public [set " + key + "]", "Public Property Let [" + key + "](v)", "Call me.[set " + key + "].call(me,v)", "End Property", "Public Property Set [" + key + "](v)", "Call me.[set " + key + "].call(me,v)", "End Property")
                        }
                    }
                }
                parts.push("End Class", "Function " + staticClass + "Factory()", "Set " + staticClass + "Factory=New " + staticClass, "End Function");
                execVB(parts.join("\n"));
                tmp = window[staticClass + "Factory"]();
                for (key in obj) {
                    tmp[key] = obj[key]
                }
                if (hasOwnProperty.call(obj, "toString")) {
                    tmp.toString = obj.toString
                }
            }
            return tmp
        },
        JSONStringify = JSON.stringify || (function(undefined) {
            function quote(string) {
                var escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    meta = {
                        "\b": "\\b",
                        "\t": "\\t",
                        "\n": "\\n",
                        "\f": "\\f",
                        "\r": "\\r",
                        '"': '\\"',
                        "\\": "\\\\"
                    };
                escapable.lastIndex = 0;
                return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                    var c = meta[a];
                    return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                }) + '"' : '"' + string + '"'
            }
            var str = function(value) {
                var isArray, result, k, n = (typeof value).charCodeAt(2);
                return n === 114 ? quote(value) : n === 109 ? isFinite(value) ? String(value) : "null" : n === 111 || n === 108 ? String(value) : n === 106 ? function() {
                    if (!value) {
                        return "null"
                    }
                    isArray = toString.apply(value) === "[object Array]";
                    result = isArray ? "[" : "{";
                    if (isArray) {
                        for (k = 0; k < value.length; k++) {
                            result += (k == 0 ? "" : ",") + str(value[k])
                        }
                    } else {
                        for (k in value) {
                            if (hasOwnProperty.call(value, k) && value[k] !== undefined) {
                                result += (result.length == 1 ? "" : ",") + quote(k) + ":" + str(value[k])
                            }
                        }
                    }
                    return result + (isArray ? "]" : "}")
                }() : undefined
            };
            return str
        })(),
        JSONParse = (function() {
            var parse = JSON.parse;
            return function(source) {
                return source ? parse ? parse(source) : (new Function("return " + source))() : Null
            }
        })(),
        historyStorage = function(state) {
            return sessionStorage ? state ? sessionStorage.setItem("__hitoryapi__", JSONStringify(state)) : JSONParse(sessionStorage.getItem("__hitoryapi__")) || {} : {}
        },
        fireStateChange = function(type, oldURL, newURL) {
            var winHndl = type === 2 ? window.onhashchange : window.onpopstate,
                name = type === 2 ? "hashchange" : "popstate",
                o, list = eventsList[name];
            if (document.createEvent) {
                o = document.createEvent("Events");
                o.initEvent(name, False, False)
            } else {
                o = document.createEventObject();
                o.type = name
            }
            o.state = History.state;
            o.oldURL = oldURL;
            o.newURL = newURL;
            if (winHndl) {
                winHndl.call(window, o)
            }
            for (var i = 0, len = list.length; i < len; i++) {
                list[i].call(window, o)
            }
        },
        hashChanged = (function() {
            var windowPopState = window.onpopstate || Null,
                windowHashChange = window.onhashchange || Null,
                popstateFired = 0,
                initialStateHandler = Null,
                urlObject = normalizeUrl(),
                oldURL = urlObject._href,
                oldHash = urlObject._hash.replace(/^#/, ""),
                fireInitialState = function() {
                    if (initialFire && !(initialFire = 0) && urlObject._relative !== sets.basepath) {
                        clearInterval(initialStateHandler);
                        setTimeout(fireStateChange, 10)
                    }
                },
                change = function(e) {
                    var urlObject = normalizeUrl();
                    if (skipHashChange) {
                        oldURL = urlObject._href;
                        return skipHashChange = 0
                    }
                    var oldUrl = e.oldURL || oldURL,
                        newUrl = oldURL = e.newURL || urlObject._href,
                        oldHash = oldUrl.replace(/^.*?(#|$)/, ""),
                        newHash = newUrl.replace(/^.*?(#|$)/, "");
                    if (oldUrl != newUrl && !popstateFired) {
                        fireStateChange()
                    }
                    popstateFired = 0;
                    initialFire = 0;
                    if (oldHash != newHash) {
                        fireStateChange(2, oldUrl, newUrl)
                    }
                };
            addEvent(eventPrefix + "hashchange", change, False);
            addEvent(eventPrefix + "popstate", function() {
                if (initialFire === windowLocation.href) {
                    return initialFire = 0
                }
                initialFire = 0;
                fireStateChange(popstateFired = 1)
            }, False);
            History.redirect = function(type, basepath) {
                sets.type = type == Null ? sets.type : type;
                sets.basepath = basepath == Null ? sets.basepath : basepath;
                if (window.top == window.self) {
                    var relative = normalizeUrl(Null, True)._relative,
                        search = windowLocation.search,
                        path = windowLocation.pathname,
                        basepath = sets.basepath;
                    if (api) {
                        if (relative != basepath && (new RegExp("^" + basepath + "$", "i")).test(path)) {
                            windowLocation.href = relative
                        }
                        if ((new RegExp("^" + basepath + "$", "i")).test(path + "/")) {
                            windowLocation.href = basepath
                        } else {
                            if (!(new RegExp("^" + basepath, "i")).test(path)) {
                                windowLocation.href = path.replace(/^\//, basepath) + search
                            }
                        }
                    } else {
                        if (path != basepath) {
                            windowLocation.href = basepath + "#" + path.replace(new RegExp("^" + basepath, "i"), sets.type) + search + windowLocation.hash
                        }
                    }
                }
            };
            History = createStaticObject(History, VBInc ? HistoryAccessors : windowHistory.state === undefined ? {
                state: HistoryAccessors.state,
                location: HistoryAccessors.location
            } : {
                location: HistoryAccessors.location
            });
            Location = createStaticObject(Location, LocationAccessors);
            window[_a] = function(event, listener, capture) {
                if (eventsList[event]) {
                    eventsList[event].push(listener);
                    if (!api && eventsListPopState === eventsList[event]) {
                        fireInitialState()
                    }
                } else {
                    if (arguments.length > 3) {
                        addEvent(event, listener, capture, arguments[3])
                    } else {
                        addEvent(event, listener, capture)
                    }
                }
            };
            window[_r] = function(event, listener, capture) {
                var list = eventsList[event];
                if (list) {
                    for (var i = list.length;
                        --i;
                    ) {
                        if (list[i] === listener) {
                            list.splice(i, 1);
                            break
                        }
                    }
                } else {
                    removeEvent(event, listener, capture)
                }
            };
            window[_d] = function(event, eventObject) {
                var type = event && event.type || event,
                    list = eventsList[event],
                    winHndl = list === eventsListPopState ? window.onpopstate : window.onhashchange;
                if (list) {
                    eventObject = eventObject || (typeof event == "string" ? window.event : event);
                    try {
                        eventObject && (eventObject.target = window)
                    } catch (_e_) {
                        try {
                            eventObject.srcElement = window
                        } catch (_e_) {}
                    }
                    if (winHndl) {
                        winHndl.call(window, eventObject)
                    }
                    for (var i = 0, len = list.length; i < len; i++) {
                        list[i].call(window, eventObject)
                    }
                    return True
                } else {
                    return fireEvent(event, eventObject)
                }
            };
            if (VBInc) {
                execScript("Public history, onhashchange", "VBScript")
            }
            if (((!defineProp && !defineGetter) || !createStaticObject(window, {
                    onhashchange: {
                        get: function() {
                            return windowHashChange
                        },
                        set: function(val) {
                            windowHashChange = val || Null
                        }
                    },
                    onpopstate: {
                        get: function() {
                            return windowPopState
                        },
                        set: function(val) {
                            if (windowPopState = (val || Null)) {
                                !api && fireInitialState()
                            }
                        }
                    }
                }, 1)) && !api) {
                initialStateHandler = setInterval(function() {
                    if (window.onpopstate) {
                        fireInitialState()
                    }
                }, 100)
            }
            if (sets.redirect) {
                History.redirect()
            }
            if (!api) {
                document[_a](eventPrefix + "click", function(e) {
                    var event = e || window.event,
                        target = event.target || event.srcElement,
                        defaultPrevented = "defaultPrevented" in event ? event.defaultPrevented : event.returnValue === False;
                    if (target && target.nodeName === "A" && !defaultPrevented) {
                        e = normalizeUrl(target.getAttribute("href", 2), True);
                        if (e._hash && e._hash !== "#" && e._hash === e._href.replace(normalizeUrl()._href.split("#").shift(), "")) {
                            history.location.hash = e._hash;
                            e = e._hash.replace(/^#/, "");
                            if ((target = document.getElementById(e)) && target.id === e && target.nodeName === "A") {
                                var rect = target.getBoundingClientRect();
                                window.scrollTo((documentElement.scrollLeft || 0), rect.top + (documentElement.scrollTop || 0) - (documentElement.clientTop || 0))
                            }
                            if (event.preventDefault) {
                                event.preventDefault()
                            } else {
                                event.returnValue = false
                            }
                        }
                    }
                }, False)
            }
            return change
        })();
    History.pushState = function(state, title, url, replace) {
        var stateObject = historyStorage(),
            currentHref = normalizeUrl()._href,
            urlObject = url && normalizeUrl(url);
        initialFire = 0;
        url = urlObject ? urlObject._href : currentHref;
        if (replace && stateObject[currentHref]) {
            delete stateObject[currentHref]
        }
        if ((!api || initialState) && sessionStorage && state) {
            stateObject[url] = state;
            historyStorage(stateObject);
            state = Null
        }
        if (historyPushState && historyReplaceState) {
            if (replace) {
                historyReplaceState.call(History, state, title, url)
            } else {
                historyPushState.call(History, state, title, url)
            }
        } else {
            if (urlObject && urlObject._relative != normalizeUrl()._relative) {
                skipHashChange = 1;
                if (replace) {
                    windowLocation.replace("#" + urlObject._special)
                } else {
                    windowLocation.hash = urlObject._special
                }
            }
        }
    };
    History.replaceState = function(state, title, url) {
        History.pushState(state, title, url, 1)
    };
    if (VBInc) {
        window.history = History;
        (function(cookie, currentHref) {
            if (!iframe) {
                return
            }
            var pushState, hashCheckerHandler, checker = function() {
                var href = normalizeUrl()._href;
                if (currentHref != href) {
                    hashChanged({
                        oldURL: currentHref,
                        newURL: currentHref = href
                    })
                }
            };
            hashCheckerHandler = setInterval(checker, 100);
            iframe.src = "javascript:true;";
            iframe = documentElement.firstChild.appendChild(iframe).contentWindow;
            History.pushState = pushState = function(state, title, url, replace, lfirst) {
                var i = iframe.document,
                    content = ["<script>", "lfirst=1;", , "storage=" + JSONStringify(state) + ";", "<\/script>"],
                    urlObject = url && normalizeUrl(url);
                if (!urlObject) {
                    iframe.storage = state;
                    return
                }
                if (!lfirst) {
                    clearInterval(hashCheckerHandler)
                }
                if (replace) {
                    if (iframe.lfirst) {
                        history.back();
                        pushState(state, title, urlObject._href, 0, 1)
                    } else {
                        iframe.storage = state;
                        windowLocation.replace("#" + urlObject._special)
                    }
                } else {
                    if (urlObject._href != currentHref || lfirst) {
                        if (!iframe.lfirst) {
                            iframe.lfirst = 1;
                            pushState(iframe.storage, title, currentHref, 0, 1)
                        }
                        content[2] = 'parent.location.hash="' + urlObject._special.replace(/"/g, '\\"') + '";';
                        i.open();
                        i.write(content.join(""));
                        i.close()
                    }
                }
                if (!lfirst) {
                    currentHref = normalizeUrl()._href;
                    hashCheckerHandler = setInterval(checker, 100)
                }
            };
            addEvent(eventPrefix + "unload", function() {
                if (iframe.storage) {
                    var state = {};
                    state[normalizeUrl()._href] = iframe.storage;
                    document.cookie = "_historyAPI=" + escape(JSONStringify(state))
                }
                clearInterval(hashCheckerHandler)
            }, False);
            if (cookie.length > 1) {
                cookie = unescape(cookie.pop().split(";").shift());
                try {
                    iframe.storage = JSONParse(cookie)[normalizeUrl()._href]
                } catch (_e_) {}
            }
            if (!JSON.parse && !JSON.stringify) {
                JSON.parse = JSONParse;
                JSON.stringify = JSONStringify;
                window.JSON = JSON
            }
        })(document.cookie.split("_historyAPI="), normalizeUrl()._href)
    } else {
        window.history.emulate = !api
    }
})(window, true, false, null);

function createCookie(c, d, e) {
    if (e) {
        var b = new Date();
        b.setTime(b.getTime() + (e * 24 * 60 * 60 * 1000));
        var a = "; expires=" + b.toGMTString()
    } else {
        var a = ""
    }
    document.cookie = c + "=" + d + a + "; path=/"
}

function readCookie(b) {
    var e = b + "=";
    var a = document.cookie.split(";");
    for (var d = 0; d < a.length; d++) {
        var f = a[d];
        while (f.charAt(0) == " ") {
            f = f.substring(1, f.length)
        }
        if (f.indexOf(e) == 0) {
            return f.substring(e.length, f.length)
        }
    }
    return null
}

function eraseCookie(a) {
    createCookie(a, "", -1)
}(function() {
    function a() {}
    a.img_path = "emoji/";
    a.sheet_path = "sheet_64.png";
    a.use_css_imgs = false;
    a.text_mode = false;
    a.include_title = false;
    a.allow_native = true;
    a.use_sheet = false;
    a.inits = {};
    a.map = {};
    a.replace_emoticons = function(b) {
        a.init_emoticons();
        return b.replace(a.rx_emoticons, function(d, c, f) {
            var e = a.map.emoticons[f];
            return e ? c + a.replacement(e, f) : d
        })
    };
    a.replace_emoticons_with_colons = function(b) {
        a.init_emoticons();
        return b.replace(a.rx_emoticons, function(d, c, f) {
            var e = a.data[a.map.emoticons[f]][3][0];
            return e ? c + ":" + e + ":" : d
        })
    };
    a.replace_colons = function(b) {
        a.init_colons();
        return b.replace(a.rx_colons, function(d) {
            var c = d.substr(1, d.length - 2);
            var e = a.map.colons[c];
            return e ? a.replacement(e, c, ":") : d
        })
    };
    a.replace_unified = function(b) {
        a.init_unified();
        return b.replace(a.rx_unified, function(c) {
            var d = a.map.unified[c];
            return d ? a.replacement(d) : c
        })
    };
    a.replacement = function(k, l, c) {
        c = c || "";
        var f = (l) ? c + l + c : a.data[k][6] || c + a.data[k][3][0] + c;
        if (a.text_mode) {
            return f
        }
        a.init_env();
        if (a.replace_mode == "unified" && a.allow_native && a.data[k][0]) {
            return a.data[k][0]
        }
        if (a.replace_mode == "softbank" && a.allow_native && a.data[k][1]) {
            return a.data[k][1]
        }
        if (a.replace_mode == "google" && a.allow_native && a.data[k][2]) {
            return a.data[k][2]
        }
        var e = a.data[k][7] || a.img_path + k + ".png";
        var h = a.include_title ? ' title="' + (l || a.data[k][3][0]) + '"' : "";
        var m = a.include_text ? c + (l || a.data[k][3][0]) + c : "";
        if (a.supports_css) {
            var j = !!a.data[k][8];
            var i = a.data[k][4];
            var g = a.data[k][5];
            if (!j && a.use_sheet && i != null && g != null) {
                var d = 100 / (a.sheet_size - 1);
                var b = "background: url(" + a.sheet_path + ");background-position:" + (d * i) + "% " + (d * g) + "%;background-size:" + a.sheet_size + "00%";
                return '<span class="emoji-outer emoji-sizer"><span class="emoji-inner" style="' + b + '"' + h + ">" + m + "</span></span>"
            } else {
                if (a.use_css_imgs) {
                    return '<span class="emoji emoji-' + k + '"' + h + ">" + m + "</span>"
                } else {
                    return '<span class="emoji emoji-sizer" style="background-image:url(' + e + ')"' + h + ">" + m + "</span>"
                }
            }
        }
        return '<img src="' + e + '" class="emoji" ' + h + "/>"
    };
    a.init_emoticons = function() {
        if (a.inits.emoticons) {
            return
        }
        a.init_colons();
        a.inits.emoticons = 1;
        var b = [];
        a.map.emoticons = {};
        for (var d in a.emoticons_data) {
            var c = d.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
            if (!a.map.colons[a.emoticons_data[d]]) {
                continue
            }
            a.map.emoticons[c] = a.map.colons[a.emoticons_data[d]];
            b.push(a.escape_rx(c))
        }
        a.rx_emoticons = new RegExp(("(^|\\s)(" + b.join("|") + ")(?=$|[\\s|\\?\\.,!])"), "g")
    };
    a.init_colons = function() {
        if (a.inits.colons) {
            return
        }
        a.inits.colons = 1;
        a.rx_colons = new RegExp(":[^\\s:]+:", "g");
        a.map.colons = {};
        for (var c in a.data) {
            for (var b = 0; b < a.data[c][3].length; b++) {
                a.map.colons[a.data[c][3][b]] = c
            }
        }
    };
    a.init_unified = function() {
        if (a.inits.unified) {
            return
        }
        a.inits.unified = 1;
        var b = [];
        for (var c in a.data) {
            b.push(a.data[c][0])
        }
        a.rx_unified = new RegExp("(" + b.join("|") + ")", "g");
        a.map.unified = {};
        for (var c in a.data) {
            a.map.unified[a.data[c][0]] = c
        }
    };
    a.init_env = function() {
        if (a.inits.env) {
            return
        }
        a.inits.env = 1;
        a.replace_mode = "img";
        a.supports_css = false;
        var c = navigator.userAgent;
        if (window.getComputedStyle) {
            var b = window.getComputedStyle(document.body);
            if (b["background-size"] || b.backgroundSize) {
                a.supports_css = true
            }
        }
        if (c.match(/(iPhone|iPod|iPad|iPhone\s+Simulator)/i)) {
            if (c.match(/OS\s+[12345]/i)) {
                a.replace_mode = "softbank";
                return
            }
            if (c.match(/OS\s+[6789]/i)) {
                a.replace_mode = "unified";
                return
            }
        }
        if (c.match(/Mac OS X 10[._ ][789]/i)) {
            if (!c.match(/Chrome/i)) {
                a.replace_mode = "unified";
                return
            }
        }
        if (false && c.match(/Android/i)) {
            a.replace_mode = "google";
            return
        }
        if (a.supports_css) {
            a.replace_mode = "css"
        }
    };
    a.escape_rx = function(b) {
        return b.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    };
    a.sheet_size = 30;
    a.data = {
        "00a9": ["\u00A9", "\uE24E", "\uDBBA\uDF29", ["copyright"], 0, 0],
        "00ae": ["\u00AE", "\uE24F", "\uDBBA\uDF2D", ["registered"], 0, 1],
        "203c": ["\u203C", "", "\uDBBA\uDF06", ["bangbang"], 0, 2],
        "2049": ["\u2049", "", "\uDBBA\uDF05", ["interrobang"], 0, 3],
        "2122": ["\u2122", "\uE537", "\uDBBA\uDF2A", ["tm"], 0, 4],
        "2139": ["\u2139", "", "\uDBBA\uDF47", ["information_source"], 0, 5],
        "2194": ["\u2194", "", "\uDBBA\uDEF6", ["left_right_arrow"], 0, 6],
        "2195": ["\u2195", "", "\uDBBA\uDEF7", ["arrow_up_down"], 0, 7],
        "2196": ["\u2196", "\uE237", "\uDBBA\uDEF2", ["arrow_upper_left"], 0, 8],
        "2197": ["\u2197", "\uE236", "\uDBBA\uDEF0", ["arrow_upper_right"], 0, 9],
        "2198": ["\u2198", "\uE238", "\uDBBA\uDEF1", ["arrow_lower_right"], 0, 10],
        "2199": ["\u2199", "\uE239", "\uDBBA\uDEF3", ["arrow_lower_left"], 0, 11],
        "21a9": ["\u21A9", "", "\uDBBA\uDF83", ["leftwards_arrow_with_hook"], 0, 12],
        "21aa": ["\u21AA", "", "\uDBBA\uDF88", ["arrow_right_hook"], 0, 13],
        "231a": ["\u231A", "", "\uDBB8\uDC1D", ["watch"], 0, 14],
        "231b": ["\u231B", "", "\uDBB8\uDC1C", ["hourglass"], 0, 15],
        "23e9": ["\u23E9", "\uE23C", "\uDBBA\uDEFE", ["fast_forward"], 0, 16],
        "23ea": ["\u23EA", "\uE23D", "\uDBBA\uDEFF", ["rewind"], 0, 17],
        "23eb": ["\u23EB", "", "\uDBBA\uDF03", ["arrow_double_up"], 0, 18],
        "23ec": ["\u23EC", "", "\uDBBA\uDF02", ["arrow_double_down"], 0, 19],
        "23f0": ["\u23F0", "\uE02D", "\uDBB8\uDC2A", ["alarm_clock"], 0, 20],
        "23f3": ["\u23F3", "", "\uDBB8\uDC1B", ["hourglass_flowing_sand"], 0, 21],
        "24c2": ["\u24C2", "\uE434", "\uDBB9\uDFE1", ["m"], 0, 22],
        "25aa": ["\u25AA", "\uE21A", "\uDBBA\uDF6E", ["black_small_square"], 0, 23],
        "25ab": ["\u25AB", "\uE21B", "\uDBBA\uDF6D", ["white_small_square"], 0, 24],
        "25b6": ["\u25B6", "\uE23A", "\uDBBA\uDEFC", ["arrow_forward"], 0, 25],
        "25c0": ["\u25C0", "\uE23B", "\uDBBA\uDEFD", ["arrow_backward"], 0, 26],
        "25fb": ["\u25FB", "\uE21B", "\uDBBA\uDF71", ["white_medium_square"], 0, 27],
        "25fc": ["\u25FC", "\uE21A", "\uDBBA\uDF72", ["black_medium_square"], 0, 28],
        "25fd": ["\u25FD", "\uE21B", "\uDBBA\uDF6F", ["white_medium_small_square"], 0, 29],
        "25fe": ["\u25FE", "\uE21A", "\uDBBA\uDF70", ["black_medium_small_square"], 1, 0],
        "2600": ["\u2600", "\uE04A", "\uDBB8\uDC00", ["sunny"], 1, 1],
        "2601": ["\u2601", "\uE049", "\uDBB8\uDC01", ["cloud"], 1, 2],
        "260e": ["\u260E", "\uE009", "\uDBB9\uDD23", ["phone", "telephone"], 1, 3],
        "2611": ["\u2611", "", "\uDBBA\uDF8B", ["ballot_box_with_check"], 1, 4],
        "2614": ["\u2614", "\uE04B", "\uDBB8\uDC02", ["umbrella"], 1, 5],
        "2615": ["\u2615", "\uE045", "\uDBBA\uDD81", ["coffee"], 1, 6],
        "261d": ["\u261D", "\uE00F", "\uDBBA\uDF98", ["point_up"], 1, 7],
        "263a": ["\u263A", "\uE414", "\uDBB8\uDF36", ["relaxed"], 1, 8],
        "2648": ["\u2648", "\uE23F", "\uDBB8\uDC2B", ["aries"], 1, 9],
        "2649": ["\u2649", "\uE240", "\uDBB8\uDC2C", ["taurus"], 1, 10],
        "264a": ["\u264A", "\uE241", "\uDBB8\uDC2D", ["gemini"], 1, 11],
        "264b": ["\u264B", "\uE242", "\uDBB8\uDC2E", ["cancer"], 1, 12],
        "264c": ["\u264C", "\uE243", "\uDBB8\uDC2F", ["leo"], 1, 13],
        "264d": ["\u264D", "\uE244", "\uDBB8\uDC30", ["virgo"], 1, 14],
        "264e": ["\u264E", "\uE245", "\uDBB8\uDC31", ["libra"], 1, 15],
        "264f": ["\u264F", "\uE246", "\uDBB8\uDC32", ["scorpius"], 1, 16],
        "2650": ["\u2650", "\uE247", "\uDBB8\uDC33", ["sagittarius"], 1, 17],
        "2651": ["\u2651", "\uE248", "\uDBB8\uDC34", ["capricorn"], 1, 18],
        "2652": ["\u2652", "\uE249", "\uDBB8\uDC35", ["aquarius"], 1, 19],
        "2653": ["\u2653", "\uE24A", "\uDBB8\uDC36", ["pisces"], 1, 20],
        "2660": ["\u2660", "\uE20E", "\uDBBA\uDF1B", ["spades"], 1, 21],
        "2663": ["\u2663", "\uE20F", "\uDBBA\uDF1D", ["clubs"], 1, 22],
        "2665": ["\u2665", "\uE20C", "\uDBBA\uDF1A", ["hearts"], 1, 23],
        "2666": ["\u2666", "\uE20D", "\uDBBA\uDF1C", ["diamonds"], 1, 24],
        "2668": ["\u2668", "\uE123", "\uDBB9\uDFFA", ["hotsprings"], 1, 25],
        "267b": ["\u267B", "", "\uDBBA\uDF2C", ["recycle"], 1, 26],
        "267f": ["\u267F", "\uE20A", "\uDBBA\uDF20", ["wheelchair"], 1, 27],
        "2693": ["\u2693", "\uE202", "\uDBB9\uDCC1", ["anchor"], 1, 28],
        "26a0": ["\u26A0", "\uE252", "\uDBBA\uDF23", ["warning"], 1, 29],
        "26a1": ["\u26A1", "\uE13D", "\uDBB8\uDC04", ["zap"], 2, 0],
        "26aa": ["\u26AA", "\uE219", "\uDBBA\uDF65", ["white_circle"], 2, 1],
        "26ab": ["\u26AB", "\uE219", "\uDBBA\uDF66", ["black_circle"], 2, 2],
        "26bd": ["\u26BD", "\uE018", "\uDBB9\uDFD4", ["soccer"], 2, 3],
        "26be": ["\u26BE", "\uE016", "\uDBB9\uDFD1", ["baseball"], 2, 4],
        "26c4": ["\u26C4", "\uE048", "\uDBB8\uDC03", ["snowman"], 2, 5],
        "26c5": ["\u26C5", "\uE04A\uE049", "\uDBB8\uDC0F", ["partly_sunny"], 2, 6],
        "26ce": ["\u26CE", "\uE24B", "\uDBB8\uDC37", ["ophiuchus"], 2, 7],
        "26d4": ["\u26D4", "\uE137", "\uDBBA\uDF26", ["no_entry"], 2, 8],
        "26ea": ["\u26EA", "\uE037", "\uDBB9\uDCBB", ["church"], 2, 9],
        "26f2": ["\u26F2", "\uE121", "\uDBB9\uDCBC", ["fountain"], 2, 10],
        "26f3": ["\u26F3", "\uE014", "\uDBB9\uDFD2", ["golf"], 2, 11],
        "26f5": ["\u26F5", "\uE01C", "\uDBB9\uDFEA", ["boat", "sailboat"], 2, 12],
        "26fa": ["\u26FA", "\uE122", "\uDBB9\uDFFB", ["tent"], 2, 13],
        "26fd": ["\u26FD", "\uE03A", "\uDBB9\uDFF5", ["fuelpump"], 2, 14],
        "2702": ["\u2702", "\uE313", "\uDBB9\uDD3E", ["scissors"], 2, 15],
        "2705": ["\u2705", "", "\uDBBA\uDF4A", ["white_check_mark"], 2, 16],
        "2708": ["\u2708", "\uE01D", "\uDBB9\uDFE9", ["airplane"], 2, 17],
        "2709": ["\u2709", "\uE103", "\uDBB9\uDD29", ["email", "envelope"], 2, 18],
        "270a": ["\u270A", "\uE010", "\uDBBA\uDF93", ["fist"], 2, 19],
        "270b": ["\u270B", "\uE012", "\uDBBA\uDF95", ["hand", "raised_hand"], 2, 20],
        "270c": ["\u270C", "\uE011", "\uDBBA\uDF94", ["v"], 2, 21],
        "270f": ["\u270F", "\uE301", "\uDBB9\uDD39", ["pencil2"], 2, 22],
        "2712": ["\u2712", "", "\uDBB9\uDD36", ["black_nib"], 2, 23],
        "2714": ["\u2714", "", "\uDBBA\uDF49", ["heavy_check_mark"], 2, 24],
        "2716": ["\u2716", "\uE333", "\uDBBA\uDF53", ["heavy_multiplication_x"], 2, 25],
        "2728": ["\u2728", "\uE32E", "\uDBBA\uDF60", ["sparkles"], 2, 26],
        "2733": ["\u2733", "\uE206", "\uDBBA\uDF62", ["eight_spoked_asterisk"], 2, 27],
        "2734": ["\u2734", "\uE205", "\uDBBA\uDF61", ["eight_pointed_black_star"], 2, 28],
        "2744": ["\u2744", "", "\uDBB8\uDC0E", ["snowflake"], 2, 29],
        "2747": ["\u2747", "\uE32E", "\uDBBA\uDF77", ["sparkle"], 3, 0],
        "274c": ["\u274C", "\uE333", "\uDBBA\uDF45", ["x"], 3, 1],
        "274e": ["\u274E", "\uE333", "\uDBBA\uDF46", ["negative_squared_cross_mark"], 3, 2],
        "2753": ["\u2753", "\uE020", "\uDBBA\uDF09", ["question"], 3, 3],
        "2754": ["\u2754", "\uE336", "\uDBBA\uDF0A", ["grey_question"], 3, 4],
        "2755": ["\u2755", "\uE337", "\uDBBA\uDF0B", ["grey_exclamation"], 3, 5],
        "2757": ["\u2757", "\uE021", "\uDBBA\uDF04", ["exclamation", "heavy_exclamation_mark"], 3, 6],
        "2764": ["\u2764", "\uE022", "\uDBBA\uDF0C", ["heart"], 3, 7, "<3"],
        "2795": ["\u2795", "", "\uDBBA\uDF51", ["heavy_plus_sign"], 3, 8],
        "2796": ["\u2796", "", "\uDBBA\uDF52", ["heavy_minus_sign"], 3, 9],
        "2797": ["\u2797", "", "\uDBBA\uDF54", ["heavy_division_sign"], 3, 10],
        "27a1": ["\u27A1", "\uE234", "\uDBBA\uDEFA", ["arrow_right"], 3, 11],
        "27b0": ["\u27B0", "", "\uDBBA\uDF08", ["curly_loop"], 3, 12],
        "27bf": ["\u27BF", "\uE211", "\uDBBA\uDC2B", ["loop"], 3, 13],
        "2934": ["\u2934", "\uE236", "\uDBBA\uDEF4", ["arrow_heading_up"], 3, 14],
        "2935": ["\u2935", "\uE238", "\uDBBA\uDEF5", ["arrow_heading_down"], 3, 15],
        "2b05": ["\u2B05", "\uE235", "\uDBBA\uDEFB", ["arrow_left"], 3, 16],
        "2b06": ["\u2B06", "\uE232", "\uDBBA\uDEF8", ["arrow_up"], 3, 17],
        "2b07": ["\u2B07", "\uE233", "\uDBBA\uDEF9", ["arrow_down"], 3, 18],
        "2b1b": ["\u2B1B", "\uE21A", "\uDBBA\uDF6C", ["black_large_square"], 3, 19],
        "2b1c": ["\u2B1C", "\uE21B", "\uDBBA\uDF6B", ["white_large_square"], 3, 20],
        "2b50": ["\u2B50", "\uE32F", "\uDBBA\uDF68", ["star"], 3, 21],
        "2b55": ["\u2B55", "\uE332", "\uDBBA\uDF44", ["o"], 3, 22],
        "3030": ["\u3030", "", "\uDBBA\uDF07", ["wavy_dash"], 3, 23],
        "303d": ["\u303D", "\uE12C", "\uDBBA\uDC1B", ["part_alternation_mark"], 3, 24],
        "3297": ["\u3297", "\uE30D", "\uDBBA\uDF43", ["congratulations"], 3, 25],
        "3299": ["\u3299", "\uE315", "\uDBBA\uDF2B", ["secret"], 3, 26],
        "1f004": ["\uD83C\uDC04", "\uE12D", "\uDBBA\uDC0B", ["mahjong"], 3, 27],
        "1f0cf": ["\uD83C\uDCCF", "", "\uDBBA\uDC12", ["black_joker"], 3, 28],
        "1f170": ["\uD83C\uDD70", "\uE532", "\uDBB9\uDD0B", ["a"], 3, 29],
        "1f171": ["\uD83C\uDD71", "\uE533", "\uDBB9\uDD0C", ["b"], 4, 0],
        "1f17e": ["\uD83C\uDD7E", "\uE535", "\uDBB9\uDD0E", ["o2"], 4, 1],
        "1f17f": ["\uD83C\uDD7F", "\uE14F", "\uDBB9\uDFF6", ["parking"], 4, 2],
        "1f18e": ["\uD83C\uDD8E", "\uE534", "\uDBB9\uDD0D", ["ab"], 4, 3],
        "1f191": ["\uD83C\uDD91", "", "\uDBBA\uDF84", ["cl"], 4, 4],
        "1f192": ["\uD83C\uDD92", "\uE214", "\uDBBA\uDF38", ["cool"], 4, 5],
        "1f193": ["\uD83C\uDD93", "", "\uDBBA\uDF21", ["free"], 4, 6],
        "1f194": ["\uD83C\uDD94", "\uE229", "\uDBBA\uDF81", ["id"], 4, 7],
        "1f195": ["\uD83C\uDD95", "\uE212", "\uDBBA\uDF36", ["new"], 4, 8],
        "1f196": ["\uD83C\uDD96", "", "\uDBBA\uDF28", ["ng"], 4, 9],
        "1f197": ["\uD83C\uDD97", "\uE24D", "\uDBBA\uDF27", ["ok"], 4, 10],
        "1f198": ["\uD83C\uDD98", "", "\uDBBA\uDF4F", ["sos"], 4, 11],
        "1f199": ["\uD83C\uDD99", "\uE213", "\uDBBA\uDF37", ["up"], 4, 12],
        "1f19a": ["\uD83C\uDD9A", "\uE12E", "\uDBBA\uDF32", ["vs"], 4, 13],
        "1f201": ["\uD83C\uDE01", "\uE203", "\uDBBA\uDF24", ["koko"], 4, 14],
        "1f202": ["\uD83C\uDE02", "\uE228", "\uDBBA\uDF3F", ["sa"], 4, 15],
        "1f21a": ["\uD83C\uDE1A", "\uE216", "\uDBBA\uDF3A", ["u7121"], 4, 16],
        "1f22f": ["\uD83C\uDE2F", "\uE22C", "\uDBBA\uDF40", ["u6307"], 4, 17],
        "1f232": ["\uD83C\uDE32", "", "\uDBBA\uDF2E", ["u7981"], 4, 18],
        "1f233": ["\uD83C\uDE33", "\uE22B", "\uDBBA\uDF2F", ["u7a7a"], 4, 19],
        "1f234": ["\uD83C\uDE34", "", "\uDBBA\uDF30", ["u5408"], 4, 20],
        "1f235": ["\uD83C\uDE35", "\uE22A", "\uDBBA\uDF31", ["u6e80"], 4, 21],
        "1f236": ["\uD83C\uDE36", "\uE215", "\uDBBA\uDF39", ["u6709"], 4, 22],
        "1f237": ["\uD83C\uDE37", "\uE217", "\uDBBA\uDF3B", ["u6708"], 4, 23],
        "1f238": ["\uD83C\uDE38", "\uE218", "\uDBBA\uDF3C", ["u7533"], 4, 24],
        "1f239": ["\uD83C\uDE39", "\uE227", "\uDBBA\uDF3E", ["u5272"], 4, 25],
        "1f23a": ["\uD83C\uDE3A", "\uE22D", "\uDBBA\uDF41", ["u55b6"], 4, 26],
        "1f250": ["\uD83C\uDE50", "\uE226", "\uDBBA\uDF3D", ["ideograph_advantage"], 4, 27],
        "1f251": ["\uD83C\uDE51", "", "\uDBBA\uDF50", ["accept"], 4, 28],
        "1f300": ["\uD83C\uDF00", "\uE443", "\uDBB8\uDC05", ["cyclone"], 4, 29],
        "1f301": ["\uD83C\uDF01", "", "\uDBB8\uDC06", ["foggy"], 5, 0],
        "1f302": ["\uD83C\uDF02", "\uE43C", "\uDBB8\uDC07", ["closed_umbrella"], 5, 1],
        "1f303": ["\uD83C\uDF03", "\uE44B", "\uDBB8\uDC08", ["night_with_stars"], 5, 2],
        "1f304": ["\uD83C\uDF04", "\uE04D", "\uDBB8\uDC09", ["sunrise_over_mountains"], 5, 3],
        "1f305": ["\uD83C\uDF05", "\uE449", "\uDBB8\uDC0A", ["sunrise"], 5, 4],
        "1f306": ["\uD83C\uDF06", "\uE146", "\uDBB8\uDC0B", ["city_sunset"], 5, 5],
        "1f307": ["\uD83C\uDF07", "\uE44A", "\uDBB8\uDC0C", ["city_sunrise"], 5, 6],
        "1f308": ["\uD83C\uDF08", "\uE44C", "\uDBB8\uDC0D", ["rainbow"], 5, 7],
        "1f309": ["\uD83C\uDF09", "\uE44B", "\uDBB8\uDC10", ["bridge_at_night"], 5, 8],
        "1f30a": ["\uD83C\uDF0A", "\uE43E", "\uDBB8\uDC38", ["ocean"], 5, 9],
        "1f30b": ["\uD83C\uDF0B", "", "\uDBB8\uDC3A", ["volcano"], 5, 10],
        "1f30c": ["\uD83C\uDF0C", "\uE44B", "\uDBB8\uDC3B", ["milky_way"], 5, 11],
        "1f30d": ["\uD83C\uDF0D", "", "", ["earth_africa"], 5, 12],
        "1f30e": ["\uD83C\uDF0E", "", "", ["earth_americas"], 5, 13],
        "1f30f": ["\uD83C\uDF0F", "", "\uDBB8\uDC39", ["earth_asia"], 5, 14],
        "1f310": ["\uD83C\uDF10", "", "", ["globe_with_meridians"], 5, 15],
        "1f311": ["\uD83C\uDF11", "", "\uDBB8\uDC11", ["new_moon"], 5, 16],
        "1f312": ["\uD83C\uDF12", "", "", ["waxing_crescent_moon"], 5, 17],
        "1f313": ["\uD83C\uDF13", "\uE04C", "\uDBB8\uDC13", ["first_quarter_moon"], 5, 18],
        "1f314": ["\uD83C\uDF14", "\uE04C", "\uDBB8\uDC12", ["moon", "waxing_gibbous_moon"], 5, 19],
        "1f315": ["\uD83C\uDF15", "", "\uDBB8\uDC15", ["full_moon"], 5, 20],
        "1f316": ["\uD83C\uDF16", "", "", ["waning_gibbous_moon"], 5, 21],
        "1f317": ["\uD83C\uDF17", "", "", ["last_quarter_moon"], 5, 22],
        "1f318": ["\uD83C\uDF18", "", "", ["waning_crescent_moon"], 5, 23],
        "1f319": ["\uD83C\uDF19", "\uE04C", "\uDBB8\uDC14", ["crescent_moon"], 5, 24],
        "1f31a": ["\uD83C\uDF1A", "", "", ["new_moon_with_face"], 5, 25],
        "1f31b": ["\uD83C\uDF1B", "\uE04C", "\uDBB8\uDC16", ["first_quarter_moon_with_face"], 5, 26],
        "1f31c": ["\uD83C\uDF1C", "", "", ["last_quarter_moon_with_face"], 5, 27],
        "1f31d": ["\uD83C\uDF1D", "", "", ["full_moon_with_face"], 5, 28],
        "1f31e": ["\uD83C\uDF1E", "", "", ["sun_with_face"], 5, 29],
        "1f31f": ["\uD83C\uDF1F", "\uE335", "\uDBBA\uDF69", ["star2"], 6, 0],
        "1f320": ["\uD83C\uDF20", "", "\uDBBA\uDF6A", ["stars"], 6, 1],
        "1f330": ["\uD83C\uDF30", "", "\uDBB8\uDC4C", ["chestnut"], 6, 2],
        "1f331": ["\uD83C\uDF31", "\uE110", "\uDBB8\uDC3E", ["seedling"], 6, 3],
        "1f332": ["\uD83C\uDF32", "", "", ["evergreen_tree"], 6, 4],
        "1f333": ["\uD83C\uDF33", "", "", ["deciduous_tree"], 6, 5],
        "1f334": ["\uD83C\uDF34", "\uE307", "\uDBB8\uDC47", ["palm_tree"], 6, 6],
        "1f335": ["\uD83C\uDF35", "\uE308", "\uDBB8\uDC48", ["cactus"], 6, 7],
        "1f337": ["\uD83C\uDF37", "\uE304", "\uDBB8\uDC3D", ["tulip"], 6, 8],
        "1f338": ["\uD83C\uDF38", "\uE030", "\uDBB8\uDC40", ["cherry_blossom"], 6, 9],
        "1f339": ["\uD83C\uDF39", "\uE032", "\uDBB8\uDC41", ["rose"], 6, 10],
        "1f33a": ["\uD83C\uDF3A", "\uE303", "\uDBB8\uDC45", ["hibiscus"], 6, 11],
        "1f33b": ["\uD83C\uDF3B", "\uE305", "\uDBB8\uDC46", ["sunflower"], 6, 12],
        "1f33c": ["\uD83C\uDF3C", "\uE305", "\uDBB8\uDC4D", ["blossom"], 6, 13],
        "1f33d": ["\uD83C\uDF3D", "", "\uDBB8\uDC4A", ["corn"], 6, 14],
        "1f33e": ["\uD83C\uDF3E", "\uE444", "\uDBB8\uDC49", ["ear_of_rice"], 6, 15],
        "1f33f": ["\uD83C\uDF3F", "\uE110", "\uDBB8\uDC4E", ["herb"], 6, 16],
        "1f340": ["\uD83C\uDF40", "\uE110", "\uDBB8\uDC3C", ["four_leaf_clover"], 6, 17],
        "1f341": ["\uD83C\uDF41", "\uE118", "\uDBB8\uDC3F", ["maple_leaf"], 6, 18],
        "1f342": ["\uD83C\uDF42", "\uE119", "\uDBB8\uDC42", ["fallen_leaf"], 6, 19],
        "1f343": ["\uD83C\uDF43", "\uE447", "\uDBB8\uDC43", ["leaves"], 6, 20],
        "1f344": ["\uD83C\uDF44", "", "\uDBB8\uDC4B", ["mushroom"], 6, 21],
        "1f345": ["\uD83C\uDF45", "\uE349", "\uDBB8\uDC55", ["tomato"], 6, 22],
        "1f346": ["\uD83C\uDF46", "\uE34A", "\uDBB8\uDC56", ["eggplant"], 6, 23],
        "1f347": ["\uD83C\uDF47", "", "\uDBB8\uDC59", ["grapes"], 6, 24],
        "1f348": ["\uD83C\uDF48", "", "\uDBB8\uDC57", ["melon"], 6, 25],
        "1f349": ["\uD83C\uDF49", "\uE348", "\uDBB8\uDC54", ["watermelon"], 6, 26],
        "1f34a": ["\uD83C\uDF4A", "\uE346", "\uDBB8\uDC52", ["tangerine"], 6, 27],
        "1f34b": ["\uD83C\uDF4B", "", "", ["lemon"], 6, 28],
        "1f34c": ["\uD83C\uDF4C", "", "\uDBB8\uDC50", ["banana"], 6, 29],
        "1f34d": ["\uD83C\uDF4D", "", "\uDBB8\uDC58", ["pineapple"], 7, 0],
        "1f34e": ["\uD83C\uDF4E", "\uE345", "\uDBB8\uDC51", ["apple"], 7, 1],
        "1f34f": ["\uD83C\uDF4F", "\uE345", "\uDBB8\uDC5B", ["green_apple"], 7, 2],
        "1f350": ["\uD83C\uDF50", "", "", ["pear"], 7, 3],
        "1f351": ["\uD83C\uDF51", "", "\uDBB8\uDC5A", ["peach"], 7, 4],
        "1f352": ["\uD83C\uDF52", "", "\uDBB8\uDC4F", ["cherries"], 7, 5],
        "1f353": ["\uD83C\uDF53", "\uE347", "\uDBB8\uDC53", ["strawberry"], 7, 6],
        "1f354": ["\uD83C\uDF54", "\uE120", "\uDBBA\uDD60", ["hamburger"], 7, 7],
        "1f355": ["\uD83C\uDF55", "", "\uDBBA\uDD75", ["pizza"], 7, 8],
        "1f356": ["\uD83C\uDF56", "", "\uDBBA\uDD72", ["meat_on_bone"], 7, 9],
        "1f357": ["\uD83C\uDF57", "", "\uDBBA\uDD76", ["poultry_leg"], 7, 10],
        "1f358": ["\uD83C\uDF58", "\uE33D", "\uDBBA\uDD69", ["rice_cracker"], 7, 11],
        "1f359": ["\uD83C\uDF59", "\uE342", "\uDBBA\uDD61", ["rice_ball"], 7, 12],
        "1f35a": ["\uD83C\uDF5A", "\uE33E", "\uDBBA\uDD6A", ["rice"], 7, 13],
        "1f35b": ["\uD83C\uDF5B", "\uE341", "\uDBBA\uDD6C", ["curry"], 7, 14],
        "1f35c": ["\uD83C\uDF5C", "\uE340", "\uDBBA\uDD63", ["ramen"], 7, 15],
        "1f35d": ["\uD83C\uDF5D", "\uE33F", "\uDBBA\uDD6B", ["spaghetti"], 7, 16],
        "1f35e": ["\uD83C\uDF5E", "\uE339", "\uDBBA\uDD64", ["bread"], 7, 17],
        "1f35f": ["\uD83C\uDF5F", "\uE33B", "\uDBBA\uDD67", ["fries"], 7, 18],
        "1f360": ["\uD83C\uDF60", "", "\uDBBA\uDD74", ["sweet_potato"], 7, 19],
        "1f361": ["\uD83C\uDF61", "\uE33C", "\uDBBA\uDD68", ["dango"], 7, 20],
        "1f362": ["\uD83C\uDF62", "\uE343", "\uDBBA\uDD6D", ["oden"], 7, 21],
        "1f363": ["\uD83C\uDF63", "\uE344", "\uDBBA\uDD6E", ["sushi"], 7, 22],
        "1f364": ["\uD83C\uDF64", "", "\uDBBA\uDD7F", ["fried_shrimp"], 7, 23],
        "1f365": ["\uD83C\uDF65", "", "\uDBBA\uDD73", ["fish_cake"], 7, 24],
        "1f366": ["\uD83C\uDF66", "\uE33A", "\uDBBA\uDD66", ["icecream"], 7, 25],
        "1f367": ["\uD83C\uDF67", "\uE43F", "\uDBBA\uDD71", ["shaved_ice"], 7, 26],
        "1f368": ["\uD83C\uDF68", "", "\uDBBA\uDD77", ["ice_cream"], 7, 27],
        "1f369": ["\uD83C\uDF69", "", "\uDBBA\uDD78", ["doughnut"], 7, 28],
        "1f36a": ["\uD83C\uDF6A", "", "\uDBBA\uDD79", ["cookie"], 7, 29],
        "1f36b": ["\uD83C\uDF6B", "", "\uDBBA\uDD7A", ["chocolate_bar"], 8, 0],
        "1f36c": ["\uD83C\uDF6C", "", "\uDBBA\uDD7B", ["candy"], 8, 1],
        "1f36d": ["\uD83C\uDF6D", "", "\uDBBA\uDD7C", ["lollipop"], 8, 2],
        "1f36e": ["\uD83C\uDF6E", "", "\uDBBA\uDD7D", ["custard"], 8, 3],
        "1f36f": ["\uD83C\uDF6F", "", "\uDBBA\uDD7E", ["honey_pot"], 8, 4],
        "1f370": ["\uD83C\uDF70", "\uE046", "\uDBBA\uDD62", ["cake"], 8, 5],
        "1f371": ["\uD83C\uDF71", "\uE34C", "\uDBBA\uDD6F", ["bento"], 8, 6],
        "1f372": ["\uD83C\uDF72", "\uE34D", "\uDBBA\uDD70", ["stew"], 8, 7],
        "1f373": ["\uD83C\uDF73", "\uE147", "\uDBBA\uDD65", ["egg"], 8, 8],
        "1f374": ["\uD83C\uDF74", "\uE043", "\uDBBA\uDD80", ["fork_and_knife"], 8, 9],
        "1f375": ["\uD83C\uDF75", "\uE338", "\uDBBA\uDD84", ["tea"], 8, 10],
        "1f376": ["\uD83C\uDF76", "\uE30B", "\uDBBA\uDD85", ["sake"], 8, 11],
        "1f377": ["\uD83C\uDF77", "\uE044", "\uDBBA\uDD86", ["wine_glass"], 8, 12],
        "1f378": ["\uD83C\uDF78", "\uE044", "\uDBBA\uDD82", ["cocktail"], 8, 13],
        "1f379": ["\uD83C\uDF79", "\uE044", "\uDBBA\uDD88", ["tropical_drink"], 8, 14],
        "1f37a": ["\uD83C\uDF7A", "\uE047", "\uDBBA\uDD83", ["beer"], 8, 15],
        "1f37b": ["\uD83C\uDF7B", "\uE30C", "\uDBBA\uDD87", ["beers"], 8, 16],
        "1f37c": ["\uD83C\uDF7C", "", "", ["baby_bottle"], 8, 17],
        "1f380": ["\uD83C\uDF80", "\uE314", "\uDBB9\uDD0F", ["ribbon"], 8, 18],
        "1f381": ["\uD83C\uDF81", "\uE112", "\uDBB9\uDD10", ["gift"], 8, 19],
        "1f382": ["\uD83C\uDF82", "\uE34B", "\uDBB9\uDD11", ["birthday"], 8, 20],
        "1f383": ["\uD83C\uDF83", "\uE445", "\uDBB9\uDD1F", ["jack_o_lantern"], 8, 21],
        "1f384": ["\uD83C\uDF84", "\uE033", "\uDBB9\uDD12", ["christmas_tree"], 8, 22],
        "1f385": ["\uD83C\uDF85", "\uE448", "\uDBB9\uDD13", ["santa"], 8, 23],
        "1f386": ["\uD83C\uDF86", "\uE117", "\uDBB9\uDD15", ["fireworks"], 8, 24],
        "1f387": ["\uD83C\uDF87", "\uE440", "\uDBB9\uDD1D", ["sparkler"], 8, 25],
        "1f388": ["\uD83C\uDF88", "\uE310", "\uDBB9\uDD16", ["balloon"], 8, 26],
        "1f389": ["\uD83C\uDF89", "\uE312", "\uDBB9\uDD17", ["tada"], 8, 27],
        "1f38a": ["\uD83C\uDF8A", "", "\uDBB9\uDD20", ["confetti_ball"], 8, 28],
        "1f38b": ["\uD83C\uDF8B", "", "\uDBB9\uDD21", ["tanabata_tree"], 8, 29],
        "1f38c": ["\uD83C\uDF8C", "\uE143", "\uDBB9\uDD14", ["crossed_flags"], 9, 0],
        "1f38d": ["\uD83C\uDF8D", "\uE436", "\uDBB9\uDD18", ["bamboo"], 9, 1],
        "1f38e": ["\uD83C\uDF8E", "\uE438", "\uDBB9\uDD19", ["dolls"], 9, 2],
        "1f38f": ["\uD83C\uDF8F", "\uE43B", "\uDBB9\uDD1C", ["flags"], 9, 3],
        "1f390": ["\uD83C\uDF90", "\uE442", "\uDBB9\uDD1E", ["wind_chime"], 9, 4],
        "1f391": ["\uD83C\uDF91", "\uE446", "\uDBB8\uDC17", ["rice_scene"], 9, 5],
        "1f392": ["\uD83C\uDF92", "\uE43A", "\uDBB9\uDD1B", ["school_satchel"], 9, 6],
        "1f393": ["\uD83C\uDF93", "\uE439", "\uDBB9\uDD1A", ["mortar_board"], 9, 7],
        "1f3a0": ["\uD83C\uDFA0", "", "\uDBB9\uDFFC", ["carousel_horse"], 9, 8],
        "1f3a1": ["\uD83C\uDFA1", "\uE124", "\uDBB9\uDFFD", ["ferris_wheel"], 9, 9],
        "1f3a2": ["\uD83C\uDFA2", "\uE433", "\uDBB9\uDFFE", ["roller_coaster"], 9, 10],
        "1f3a3": ["\uD83C\uDFA3", "\uE019", "\uDBB9\uDFFF", ["fishing_pole_and_fish"], 9, 11],
        "1f3a4": ["\uD83C\uDFA4", "\uE03C", "\uDBBA\uDC00", ["microphone"], 9, 12],
        "1f3a5": ["\uD83C\uDFA5", "\uE03D", "\uDBBA\uDC01", ["movie_camera"], 9, 13],
        "1f3a6": ["\uD83C\uDFA6", "\uE507", "\uDBBA\uDC02", ["cinema"], 9, 14],
        "1f3a7": ["\uD83C\uDFA7", "\uE30A", "\uDBBA\uDC03", ["headphones"], 9, 15],
        "1f3a8": ["\uD83C\uDFA8", "\uE502", "\uDBBA\uDC04", ["art"], 9, 16],
        "1f3a9": ["\uD83C\uDFA9", "\uE503", "\uDBBA\uDC05", ["tophat"], 9, 17],
        "1f3aa": ["\uD83C\uDFAA", "", "\uDBBA\uDC06", ["circus_tent"], 9, 18],
        "1f3ab": ["\uD83C\uDFAB", "\uE125", "\uDBBA\uDC07", ["ticket"], 9, 19],
        "1f3ac": ["\uD83C\uDFAC", "\uE324", "\uDBBA\uDC08", ["clapper"], 9, 20],
        "1f3ad": ["\uD83C\uDFAD", "\uE503", "\uDBBA\uDC09", ["performing_arts"], 9, 21],
        "1f3ae": ["\uD83C\uDFAE", "", "\uDBBA\uDC0A", ["video_game"], 9, 22],
        "1f3af": ["\uD83C\uDFAF", "\uE130", "\uDBBA\uDC0C", ["dart"], 9, 23],
        "1f3b0": ["\uD83C\uDFB0", "\uE133", "\uDBBA\uDC0D", ["slot_machine"], 9, 24],
        "1f3b1": ["\uD83C\uDFB1", "\uE42C", "\uDBBA\uDC0E", ["8ball"], 9, 25],
        "1f3b2": ["\uD83C\uDFB2", "", "\uDBBA\uDC0F", ["game_die"], 9, 26],
        "1f3b3": ["\uD83C\uDFB3", "", "\uDBBA\uDC10", ["bowling"], 9, 27],
        "1f3b4": ["\uD83C\uDFB4", "", "\uDBBA\uDC11", ["flower_playing_cards"], 9, 28],
        "1f3b5": ["\uD83C\uDFB5", "\uE03E", "\uDBBA\uDC13", ["musical_note"], 9, 29],
        "1f3b6": ["\uD83C\uDFB6", "\uE326", "\uDBBA\uDC14", ["notes"], 10, 0],
        "1f3b7": ["\uD83C\uDFB7", "\uE040", "\uDBBA\uDC15", ["saxophone"], 10, 1],
        "1f3b8": ["\uD83C\uDFB8", "\uE041", "\uDBBA\uDC16", ["guitar"], 10, 2],
        "1f3b9": ["\uD83C\uDFB9", "", "\uDBBA\uDC17", ["musical_keyboard"], 10, 3],
        "1f3ba": ["\uD83C\uDFBA", "\uE042", "\uDBBA\uDC18", ["trumpet"], 10, 4],
        "1f3bb": ["\uD83C\uDFBB", "", "\uDBBA\uDC19", ["violin"], 10, 5],
        "1f3bc": ["\uD83C\uDFBC", "\uE326", "\uDBBA\uDC1A", ["musical_score"], 10, 6],
        "1f3bd": ["\uD83C\uDFBD", "", "\uDBB9\uDFD0", ["running_shirt_with_sash"], 10, 7],
        "1f3be": ["\uD83C\uDFBE", "\uE015", "\uDBB9\uDFD3", ["tennis"], 10, 8],
        "1f3bf": ["\uD83C\uDFBF", "\uE013", "\uDBB9\uDFD5", ["ski"], 10, 9],
        "1f3c0": ["\uD83C\uDFC0", "\uE42A", "\uDBB9\uDFD6", ["basketball"], 10, 10],
        "1f3c1": ["\uD83C\uDFC1", "\uE132", "\uDBB9\uDFD7", ["checkered_flag"], 10, 11],
        "1f3c2": ["\uD83C\uDFC2", "", "\uDBB9\uDFD8", ["snowboarder"], 10, 12],
        "1f3c3": ["\uD83C\uDFC3", "\uE115", "\uDBB9\uDFD9", ["runner", "running"], 10, 13],
        "1f3c4": ["\uD83C\uDFC4", "\uE017", "\uDBB9\uDFDA", ["surfer"], 10, 14],
        "1f3c6": ["\uD83C\uDFC6", "\uE131", "\uDBB9\uDFDB", ["trophy"], 10, 15],
        "1f3c7": ["\uD83C\uDFC7", "", "", ["horse_racing"], 10, 16],
        "1f3c8": ["\uD83C\uDFC8", "\uE42B", "\uDBB9\uDFDD", ["football"], 10, 17],
        "1f3c9": ["\uD83C\uDFC9", "", "", ["rugby_football"], 10, 18],
        "1f3ca": ["\uD83C\uDFCA", "\uE42D", "\uDBB9\uDFDE", ["swimmer"], 10, 19],
        "1f3e0": ["\uD83C\uDFE0", "\uE036", "\uDBB9\uDCB0", ["house"], 10, 20],
        "1f3e1": ["\uD83C\uDFE1", "\uE036", "\uDBB9\uDCB1", ["house_with_garden"], 10, 21],
        "1f3e2": ["\uD83C\uDFE2", "\uE038", "\uDBB9\uDCB2", ["office"], 10, 22],
        "1f3e3": ["\uD83C\uDFE3", "\uE153", "\uDBB9\uDCB3", ["post_office"], 10, 23],
        "1f3e4": ["\uD83C\uDFE4", "", "", ["european_post_office"], 10, 24],
        "1f3e5": ["\uD83C\uDFE5", "\uE155", "\uDBB9\uDCB4", ["hospital"], 10, 25],
        "1f3e6": ["\uD83C\uDFE6", "\uE14D", "\uDBB9\uDCB5", ["bank"], 10, 26],
        "1f3e7": ["\uD83C\uDFE7", "\uE154", "\uDBB9\uDCB6", ["atm"], 10, 27],
        "1f3e8": ["\uD83C\uDFE8", "\uE158", "\uDBB9\uDCB7", ["hotel"], 10, 28],
        "1f3e9": ["\uD83C\uDFE9", "\uE501", "\uDBB9\uDCB8", ["love_hotel"], 10, 29],
        "1f3ea": ["\uD83C\uDFEA", "\uE156", "\uDBB9\uDCB9", ["convenience_store"], 11, 0],
        "1f3eb": ["\uD83C\uDFEB", "\uE157", "\uDBB9\uDCBA", ["school"], 11, 1],
        "1f3ec": ["\uD83C\uDFEC", "\uE504", "\uDBB9\uDCBD", ["department_store"], 11, 2],
        "1f3ed": ["\uD83C\uDFED", "\uE508", "\uDBB9\uDCC0", ["factory"], 11, 3],
        "1f3ee": ["\uD83C\uDFEE", "\uE30B", "\uDBB9\uDCC2", ["izakaya_lantern", "lantern"], 11, 4],
        "1f3ef": ["\uD83C\uDFEF", "\uE505", "\uDBB9\uDCBE", ["japanese_castle"], 11, 5],
        "1f3f0": ["\uD83C\uDFF0", "\uE506", "\uDBB9\uDCBF", ["european_castle"], 11, 6],
        "1f400": ["\uD83D\uDC00", "", "", ["rat"], 11, 7],
        "1f401": ["\uD83D\uDC01", "", "", ["mouse2"], 11, 8],
        "1f402": ["\uD83D\uDC02", "", "", ["ox"], 11, 9],
        "1f403": ["\uD83D\uDC03", "", "", ["water_buffalo"], 11, 10],
        "1f404": ["\uD83D\uDC04", "", "", ["cow2"], 11, 11],
        "1f405": ["\uD83D\uDC05", "", "", ["tiger2"], 11, 12],
        "1f406": ["\uD83D\uDC06", "", "", ["leopard"], 11, 13],
        "1f407": ["\uD83D\uDC07", "", "", ["rabbit2"], 11, 14],
        "1f408": ["\uD83D\uDC08", "", "", ["cat2"], 11, 15],
        "1f409": ["\uD83D\uDC09", "", "", ["dragon"], 11, 16],
        "1f40a": ["\uD83D\uDC0A", "", "", ["crocodile"], 11, 17],
        "1f40b": ["\uD83D\uDC0B", "", "", ["whale2"], 11, 18],
        "1f40c": ["\uD83D\uDC0C", "", "\uDBB8\uDDB9", ["snail"], 11, 19],
        "1f40d": ["\uD83D\uDC0D", "\uE52D", "\uDBB8\uDDD3", ["snake"], 11, 20],
        "1f40e": ["\uD83D\uDC0E", "\uE134", "\uDBB9\uDFDC", ["racehorse"], 11, 21],
        "1f40f": ["\uD83D\uDC0F", "", "", ["ram"], 11, 22],
        "1f410": ["\uD83D\uDC10", "", "", ["goat"], 11, 23],
        "1f411": ["\uD83D\uDC11", "\uE529", "\uDBB8\uDDCF", ["sheep"], 11, 24],
        "1f412": ["\uD83D\uDC12", "\uE528", "\uDBB8\uDDCE", ["monkey"], 11, 25],
        "1f413": ["\uD83D\uDC13", "", "", ["rooster"], 11, 26],
        "1f414": ["\uD83D\uDC14", "\uE52E", "\uDBB8\uDDD4", ["chicken"], 11, 27],
        "1f415": ["\uD83D\uDC15", "", "", ["dog2"], 11, 28],
        "1f416": ["\uD83D\uDC16", "", "", ["pig2"], 11, 29],
        "1f417": ["\uD83D\uDC17", "\uE52F", "\uDBB8\uDDD5", ["boar"], 12, 0],
        "1f418": ["\uD83D\uDC18", "\uE526", "\uDBB8\uDDCC", ["elephant"], 12, 1],
        "1f419": ["\uD83D\uDC19", "\uE10A", "\uDBB8\uDDC5", ["octopus"], 12, 2],
        "1f41a": ["\uD83D\uDC1A", "\uE441", "\uDBB8\uDDC6", ["shell"], 12, 3],
        "1f41b": ["\uD83D\uDC1B", "\uE525", "\uDBB8\uDDCB", ["bug"], 12, 4],
        "1f41c": ["\uD83D\uDC1C", "", "\uDBB8\uDDDA", ["ant"], 12, 5],
        "1f41d": ["\uD83D\uDC1D", "", "\uDBB8\uDDE1", ["bee", "honeybee"], 12, 6],
        "1f41e": ["\uD83D\uDC1E", "", "\uDBB8\uDDE2", ["beetle"], 12, 7],
        "1f41f": ["\uD83D\uDC1F", "\uE019", "\uDBB8\uDDBD", ["fish"], 12, 8],
        "1f420": ["\uD83D\uDC20", "\uE522", "\uDBB8\uDDC9", ["tropical_fish"], 12, 9],
        "1f421": ["\uD83D\uDC21", "\uE019", "\uDBB8\uDDD9", ["blowfish"], 12, 10],
        "1f422": ["\uD83D\uDC22", "", "\uDBB8\uDDDC", ["turtle"], 12, 11],
        "1f423": ["\uD83D\uDC23", "\uE523", "\uDBB8\uDDDD", ["hatching_chick"], 12, 12],
        "1f424": ["\uD83D\uDC24", "\uE523", "\uDBB8\uDDBA", ["baby_chick"], 12, 13],
        "1f425": ["\uD83D\uDC25", "\uE523", "\uDBB8\uDDBB", ["hatched_chick"], 12, 14],
        "1f426": ["\uD83D\uDC26", "\uE521", "\uDBB8\uDDC8", ["bird"], 12, 15],
        "1f427": ["\uD83D\uDC27", "\uE055", "\uDBB8\uDDBC", ["penguin"], 12, 16],
        "1f428": ["\uD83D\uDC28", "\uE527", "\uDBB8\uDDCD", ["koala"], 12, 17],
        "1f429": ["\uD83D\uDC29", "\uE052", "\uDBB8\uDDD8", ["poodle"], 12, 18],
        "1f42a": ["\uD83D\uDC2A", "", "", ["dromedary_camel"], 12, 19],
        "1f42b": ["\uD83D\uDC2B", "\uE530", "\uDBB8\uDDD6", ["camel"], 12, 20],
        "1f42c": ["\uD83D\uDC2C", "\uE520", "\uDBB8\uDDC7", ["dolphin", "flipper"], 12, 21],
        "1f42d": ["\uD83D\uDC2D", "\uE053", "\uDBB8\uDDC2", ["mouse"], 12, 22],
        "1f42e": ["\uD83D\uDC2E", "\uE52B", "\uDBB8\uDDD1", ["cow"], 12, 23],
        "1f42f": ["\uD83D\uDC2F", "\uE050", "\uDBB8\uDDC0", ["tiger"], 12, 24],
        "1f430": ["\uD83D\uDC30", "\uE52C", "\uDBB8\uDDD2", ["rabbit"], 12, 25],
        "1f431": ["\uD83D\uDC31", "\uE04F", "\uDBB8\uDDB8", ["cat"], 12, 26],
        "1f432": ["\uD83D\uDC32", "", "\uDBB8\uDDDE", ["dragon_face"], 12, 27],
        "1f433": ["\uD83D\uDC33", "\uE054", "\uDBB8\uDDC3", ["whale"], 12, 28],
        "1f434": ["\uD83D\uDC34", "\uE01A", "\uDBB8\uDDBE", ["horse"], 12, 29],
        "1f435": ["\uD83D\uDC35", "\uE109", "\uDBB8\uDDC4", ["monkey_face"], 13, 0],
        "1f436": ["\uD83D\uDC36", "\uE052", "\uDBB8\uDDB7", ["dog"], 13, 1],
        "1f437": ["\uD83D\uDC37", "\uE10B", "\uDBB8\uDDBF", ["pig"], 13, 2],
        "1f438": ["\uD83D\uDC38", "\uE531", "\uDBB8\uDDD7", ["frog"], 13, 3],
        "1f439": ["\uD83D\uDC39", "\uE524", "\uDBB8\uDDCA", ["hamster"], 13, 4],
        "1f43a": ["\uD83D\uDC3A", "\uE52A", "\uDBB8\uDDD0", ["wolf"], 13, 5],
        "1f43b": ["\uD83D\uDC3B", "\uE051", "\uDBB8\uDDC1", ["bear"], 13, 6],
        "1f43c": ["\uD83D\uDC3C", "", "\uDBB8\uDDDF", ["panda_face"], 13, 7],
        "1f43d": ["\uD83D\uDC3D", "\uE10B", "\uDBB8\uDDE0", ["pig_nose"], 13, 8],
        "1f43e": ["\uD83D\uDC3E", "\uE536", "\uDBB8\uDDDB", ["feet", "paw_prints"], 13, 9],
        "1f440": ["\uD83D\uDC40", "\uE419", "\uDBB8\uDD90", ["eyes"], 13, 10],
        "1f442": ["\uD83D\uDC42", "\uE41B", "\uDBB8\uDD91", ["ear"], 13, 11],
        "1f443": ["\uD83D\uDC43", "\uE41A", "\uDBB8\uDD92", ["nose"], 13, 12],
        "1f444": ["\uD83D\uDC44", "\uE41C", "\uDBB8\uDD93", ["lips"], 13, 13],
        "1f445": ["\uD83D\uDC45", "\uE409", "\uDBB8\uDD94", ["tongue"], 13, 14],
        "1f446": ["\uD83D\uDC46", "\uE22E", "\uDBBA\uDF99", ["point_up_2"], 13, 15],
        "1f447": ["\uD83D\uDC47", "\uE22F", "\uDBBA\uDF9A", ["point_down"], 13, 16],
        "1f448": ["\uD83D\uDC48", "\uE230", "\uDBBA\uDF9B", ["point_left"], 13, 17],
        "1f449": ["\uD83D\uDC49", "\uE231", "\uDBBA\uDF9C", ["point_right"], 13, 18],
        "1f44a": ["\uD83D\uDC4A", "\uE00D", "\uDBBA\uDF96", ["facepunch", "punch"], 13, 19],
        "1f44b": ["\uD83D\uDC4B", "\uE41E", "\uDBBA\uDF9D", ["wave"], 13, 20],
        "1f44c": ["\uD83D\uDC4C", "\uE420", "\uDBBA\uDF9F", ["ok_hand"], 13, 21],
        "1f44d": ["\uD83D\uDC4D", "\uE00E", "\uDBBA\uDF97", ["+1", "thumbsup"], 13, 22],
        "1f44e": ["\uD83D\uDC4E", "\uE421", "\uDBBA\uDFA0", ["-1", "thumbsdown"], 13, 23],
        "1f44f": ["\uD83D\uDC4F", "\uE41F", "\uDBBA\uDF9E", ["clap"], 13, 24],
        "1f450": ["\uD83D\uDC50", "\uE422", "\uDBBA\uDFA1", ["open_hands"], 13, 25],
        "1f451": ["\uD83D\uDC51", "\uE10E", "\uDBB9\uDCD1", ["crown"], 13, 26],
        "1f452": ["\uD83D\uDC52", "\uE318", "\uDBB9\uDCD4", ["womans_hat"], 13, 27],
        "1f453": ["\uD83D\uDC53", "", "\uDBB9\uDCCE", ["eyeglasses"], 13, 28],
        "1f454": ["\uD83D\uDC54", "\uE302", "\uDBB9\uDCD3", ["necktie"], 13, 29],
        "1f455": ["\uD83D\uDC55", "\uE006", "\uDBB9\uDCCF", ["shirt", "tshirt"], 14, 0],
        "1f456": ["\uD83D\uDC56", "", "\uDBB9\uDCD0", ["jeans"], 14, 1],
        "1f457": ["\uD83D\uDC57", "\uE319", "\uDBB9\uDCD5", ["dress"], 14, 2],
        "1f458": ["\uD83D\uDC58", "\uE321", "\uDBB9\uDCD9", ["kimono"], 14, 3],
        "1f459": ["\uD83D\uDC59", "\uE322", "\uDBB9\uDCDA", ["bikini"], 14, 4],
        "1f45a": ["\uD83D\uDC5A", "\uE006", "\uDBB9\uDCDB", ["womans_clothes"], 14, 5],
        "1f45b": ["\uD83D\uDC5B", "", "\uDBB9\uDCDC", ["purse"], 14, 6],
        "1f45c": ["\uD83D\uDC5C", "\uE323", "\uDBB9\uDCF0", ["handbag"], 14, 7],
        "1f45d": ["\uD83D\uDC5D", "", "\uDBB9\uDCF1", ["pouch"], 14, 8],
        "1f45e": ["\uD83D\uDC5E", "\uE007", "\uDBB9\uDCCC", ["mans_shoe", "shoe"], 14, 9],
        "1f45f": ["\uD83D\uDC5F", "\uE007", "\uDBB9\uDCCD", ["athletic_shoe"], 14, 10],
        "1f460": ["\uD83D\uDC60", "\uE13E", "\uDBB9\uDCD6", ["high_heel"], 14, 11],
        "1f461": ["\uD83D\uDC61", "\uE31A", "\uDBB9\uDCD7", ["sandal"], 14, 12],
        "1f462": ["\uD83D\uDC62", "\uE31B", "\uDBB9\uDCD8", ["boot"], 14, 13],
        "1f463": ["\uD83D\uDC63", "\uE536", "\uDBB9\uDD53", ["footprints"], 14, 14],
        "1f464": ["\uD83D\uDC64", "", "\uDBB8\uDD9A", ["bust_in_silhouette"], 14, 15],
        "1f465": ["\uD83D\uDC65", "", "", ["busts_in_silhouette"], 14, 16],
        "1f466": ["\uD83D\uDC66", "\uE001", "\uDBB8\uDD9B", ["boy"], 14, 17],
        "1f467": ["\uD83D\uDC67", "\uE002", "\uDBB8\uDD9C", ["girl"], 14, 18],
        "1f468": ["\uD83D\uDC68", "\uE004", "\uDBB8\uDD9D", ["man"], 14, 19],
        "1f469": ["\uD83D\uDC69", "\uE005", "\uDBB8\uDD9E", ["woman"], 14, 20],
        "1f46a": ["\uD83D\uDC6A", "", "\uDBB8\uDD9F", ["family"], 14, 21],
        "1f46b": ["\uD83D\uDC6B", "\uE428", "\uDBB8\uDDA0", ["couple"], 14, 22],
        "1f46c": ["\uD83D\uDC6C", "", "", ["two_men_holding_hands"], 14, 23],
        "1f46d": ["\uD83D\uDC6D", "", "", ["two_women_holding_hands"], 14, 24],
        "1f46e": ["\uD83D\uDC6E", "\uE152", "\uDBB8\uDDA1", ["cop"], 14, 25],
        "1f46f": ["\uD83D\uDC6F", "\uE429", "\uDBB8\uDDA2", ["dancers"], 14, 26],
        "1f470": ["\uD83D\uDC70", "", "\uDBB8\uDDA3", ["bride_with_veil"], 14, 27],
        "1f471": ["\uD83D\uDC71", "\uE515", "\uDBB8\uDDA4", ["person_with_blond_hair"], 14, 28],
        "1f472": ["\uD83D\uDC72", "\uE516", "\uDBB8\uDDA5", ["man_with_gua_pi_mao"], 14, 29],
        "1f473": ["\uD83D\uDC73", "\uE517", "\uDBB8\uDDA6", ["man_with_turban"], 15, 0],
        "1f474": ["\uD83D\uDC74", "\uE518", "\uDBB8\uDDA7", ["older_man"], 15, 1],
        "1f475": ["\uD83D\uDC75", "\uE519", "\uDBB8\uDDA8", ["older_woman"], 15, 2],
        "1f476": ["\uD83D\uDC76", "\uE51A", "\uDBB8\uDDA9", ["baby"], 15, 3],
        "1f477": ["\uD83D\uDC77", "\uE51B", "\uDBB8\uDDAA", ["construction_worker"], 15, 4],
        "1f478": ["\uD83D\uDC78", "\uE51C", "\uDBB8\uDDAB", ["princess"], 15, 5],
        "1f479": ["\uD83D\uDC79", "", "\uDBB8\uDDAC", ["japanese_ogre"], 15, 6],
        "1f47a": ["\uD83D\uDC7A", "", "\uDBB8\uDDAD", ["japanese_goblin"], 15, 7],
        "1f47b": ["\uD83D\uDC7B", "\uE11B", "\uDBB8\uDDAE", ["ghost"], 15, 8],
        "1f47c": ["\uD83D\uDC7C", "\uE04E", "\uDBB8\uDDAF", ["angel"], 15, 9],
        "1f47d": ["\uD83D\uDC7D", "\uE10C", "\uDBB8\uDDB0", ["alien"], 15, 10],
        "1f47e": ["\uD83D\uDC7E", "\uE12B", "\uDBB8\uDDB1", ["space_invader"], 15, 11],
        "1f47f": ["\uD83D\uDC7F", "\uE11A", "\uDBB8\uDDB2", ["imp"], 15, 12],
        "1f480": ["\uD83D\uDC80", "\uE11C", "\uDBB8\uDDB3", ["skull"], 15, 13],
        "1f481": ["\uD83D\uDC81", "\uE253", "\uDBB8\uDDB4", ["information_desk_person"], 15, 14],
        "1f482": ["\uD83D\uDC82", "\uE51E", "\uDBB8\uDDB5", ["guardsman"], 15, 15],
        "1f483": ["\uD83D\uDC83", "\uE51F", "\uDBB8\uDDB6", ["dancer"], 15, 16],
        "1f484": ["\uD83D\uDC84", "\uE31C", "\uDBB8\uDD95", ["lipstick"], 15, 17],
        "1f485": ["\uD83D\uDC85", "\uE31D", "\uDBB8\uDD96", ["nail_care"], 15, 18],
        "1f486": ["\uD83D\uDC86", "\uE31E", "\uDBB8\uDD97", ["massage"], 15, 19],
        "1f487": ["\uD83D\uDC87", "\uE31F", "\uDBB8\uDD98", ["haircut"], 15, 20],
        "1f488": ["\uD83D\uDC88", "\uE320", "\uDBB8\uDD99", ["barber"], 15, 21],
        "1f489": ["\uD83D\uDC89", "\uE13B", "\uDBB9\uDD09", ["syringe"], 15, 22],
        "1f48a": ["\uD83D\uDC8A", "\uE30F", "\uDBB9\uDD0A", ["pill"], 15, 23],
        "1f48b": ["\uD83D\uDC8B", "\uE003", "\uDBBA\uDC23", ["kiss"], 15, 24],
        "1f48c": ["\uD83D\uDC8C", "\uE103\uE328", "\uDBBA\uDC24", ["love_letter"], 15, 25],
        "1f48d": ["\uD83D\uDC8D", "\uE034", "\uDBBA\uDC25", ["ring"], 15, 26],
        "1f48e": ["\uD83D\uDC8E", "\uE035", "\uDBBA\uDC26", ["gem"], 15, 27],
        "1f48f": ["\uD83D\uDC8F", "\uE111", "\uDBBA\uDC27", ["couplekiss"], 15, 28],
        "1f490": ["\uD83D\uDC90", "\uE306", "\uDBBA\uDC28", ["bouquet"], 15, 29],
        "1f491": ["\uD83D\uDC91", "\uE425", "\uDBBA\uDC29", ["couple_with_heart"], 16, 0],
        "1f492": ["\uD83D\uDC92", "\uE43D", "\uDBBA\uDC2A", ["wedding"], 16, 1],
        "1f493": ["\uD83D\uDC93", "\uE327", "\uDBBA\uDF0D", ["heartbeat"], 16, 2],
        "1f494": ["\uD83D\uDC94", "\uE023", "\uDBBA\uDF0E", ["broken_heart"], 16, 3, "</3"],
        "1f495": ["\uD83D\uDC95", "\uE327", "\uDBBA\uDF0F", ["two_hearts"], 16, 4],
        "1f496": ["\uD83D\uDC96", "\uE327", "\uDBBA\uDF10", ["sparkling_heart"], 16, 5],
        "1f497": ["\uD83D\uDC97", "\uE328", "\uDBBA\uDF11", ["heartpulse"], 16, 6],
        "1f498": ["\uD83D\uDC98", "\uE329", "\uDBBA\uDF12", ["cupid"], 16, 7],
        "1f499": ["\uD83D\uDC99", "\uE32A", "\uDBBA\uDF13", ["blue_heart"], 16, 8, "<3"],
        "1f49a": ["\uD83D\uDC9A", "\uE32B", "\uDBBA\uDF14", ["green_heart"], 16, 9, "<3"],
        "1f49b": ["\uD83D\uDC9B", "\uE32C", "\uDBBA\uDF15", ["yellow_heart"], 16, 10, "<3"],
        "1f49c": ["\uD83D\uDC9C", "\uE32D", "\uDBBA\uDF16", ["purple_heart"], 16, 11, "<3"],
        "1f49d": ["\uD83D\uDC9D", "\uE437", "\uDBBA\uDF17", ["gift_heart"], 16, 12],
        "1f49e": ["\uD83D\uDC9E", "\uE327", "\uDBBA\uDF18", ["revolving_hearts"], 16, 13],
        "1f49f": ["\uD83D\uDC9F", "\uE204", "\uDBBA\uDF19", ["heart_decoration"], 16, 14],
        "1f4a0": ["\uD83D\uDCA0", "", "\uDBBA\uDF55", ["diamond_shape_with_a_dot_inside"], 16, 15],
        "1f4a1": ["\uD83D\uDCA1", "\uE10F", "\uDBBA\uDF56", ["bulb"], 16, 16],
        "1f4a2": ["\uD83D\uDCA2", "\uE334", "\uDBBA\uDF57", ["anger"], 16, 17],
        "1f4a3": ["\uD83D\uDCA3", "\uE311", "\uDBBA\uDF58", ["bomb"], 16, 18],
        "1f4a4": ["\uD83D\uDCA4", "\uE13C", "\uDBBA\uDF59", ["zzz"], 16, 19],
        "1f4a5": ["\uD83D\uDCA5", "", "\uDBBA\uDF5A", ["boom", "collision"], 16, 20],
        "1f4a6": ["\uD83D\uDCA6", "\uE331", "\uDBBA\uDF5B", ["sweat_drops"], 16, 21],
        "1f4a7": ["\uD83D\uDCA7", "\uE331", "\uDBBA\uDF5C", ["droplet"], 16, 22],
        "1f4a8": ["\uD83D\uDCA8", "\uE330", "\uDBBA\uDF5D", ["dash"], 16, 23],
        "1f4a9": ["\uD83D\uDCA9", "\uE05A", "\uDBB9\uDCF4", ["hankey", "poop", "shit"], 16, 24],
        "1f4aa": ["\uD83D\uDCAA", "\uE14C", "\uDBBA\uDF5E", ["muscle"], 16, 25],
        "1f4ab": ["\uD83D\uDCAB", "\uE407", "\uDBBA\uDF5F", ["dizzy"], 16, 26],
        "1f4ac": ["\uD83D\uDCAC", "", "\uDBB9\uDD32", ["speech_balloon"], 16, 27],
        "1f4ad": ["\uD83D\uDCAD", "", "", ["thought_balloon"], 16, 28],
        "1f4ae": ["\uD83D\uDCAE", "", "\uDBBA\uDF7A", ["white_flower"], 16, 29],
        "1f4af": ["\uD83D\uDCAF", "", "\uDBBA\uDF7B", ["100"], 17, 0],
        "1f4b0": ["\uD83D\uDCB0", "\uE12F", "\uDBB9\uDCDD", ["moneybag"], 17, 1],
        "1f4b1": ["\uD83D\uDCB1", "\uE149", "\uDBB9\uDCDE", ["currency_exchange"], 17, 2],
        "1f4b2": ["\uD83D\uDCB2", "\uE12F", "\uDBB9\uDCE0", ["heavy_dollar_sign"], 17, 3],
        "1f4b3": ["\uD83D\uDCB3", "", "\uDBB9\uDCE1", ["credit_card"], 17, 4],
        "1f4b4": ["\uD83D\uDCB4", "", "\uDBB9\uDCE2", ["yen"], 17, 5],
        "1f4b5": ["\uD83D\uDCB5", "\uE12F", "\uDBB9\uDCE3", ["dollar"], 17, 6],
        "1f4b6": ["\uD83D\uDCB6", "", "", ["euro"], 17, 7],
        "1f4b7": ["\uD83D\uDCB7", "", "", ["pound"], 17, 8],
        "1f4b8": ["\uD83D\uDCB8", "", "\uDBB9\uDCE4", ["money_with_wings"], 17, 9],
        "1f4b9": ["\uD83D\uDCB9", "\uE14A", "\uDBB9\uDCDF", ["chart"], 17, 10],
        "1f4ba": ["\uD83D\uDCBA", "\uE11F", "\uDBB9\uDD37", ["seat"], 17, 11],
        "1f4bb": ["\uD83D\uDCBB", "\uE00C", "\uDBB9\uDD38", ["computer"], 17, 12],
        "1f4bc": ["\uD83D\uDCBC", "\uE11E", "\uDBB9\uDD3B", ["briefcase"], 17, 13],
        "1f4bd": ["\uD83D\uDCBD", "\uE316", "\uDBB9\uDD3C", ["minidisc"], 17, 14],
        "1f4be": ["\uD83D\uDCBE", "\uE316", "\uDBB9\uDD3D", ["floppy_disk"], 17, 15],
        "1f4bf": ["\uD83D\uDCBF", "\uE126", "\uDBBA\uDC1D", ["cd"], 17, 16],
        "1f4c0": ["\uD83D\uDCC0", "\uE127", "\uDBBA\uDC1E", ["dvd"], 17, 17],
        "1f4c1": ["\uD83D\uDCC1", "", "\uDBB9\uDD43", ["file_folder"], 17, 18],
        "1f4c2": ["\uD83D\uDCC2", "", "\uDBB9\uDD44", ["open_file_folder"], 17, 19],
        "1f4c3": ["\uD83D\uDCC3", "\uE301", "\uDBB9\uDD40", ["page_with_curl"], 17, 20],
        "1f4c4": ["\uD83D\uDCC4", "\uE301", "\uDBB9\uDD41", ["page_facing_up"], 17, 21],
        "1f4c5": ["\uD83D\uDCC5", "", "\uDBB9\uDD42", ["date"], 17, 22],
        "1f4c6": ["\uD83D\uDCC6", "", "\uDBB9\uDD49", ["calendar"], 17, 23],
        "1f4c7": ["\uD83D\uDCC7", "\uE148", "\uDBB9\uDD4D", ["card_index"], 17, 24],
        "1f4c8": ["\uD83D\uDCC8", "\uE14A", "\uDBB9\uDD4B", ["chart_with_upwards_trend"], 17, 25],
        "1f4c9": ["\uD83D\uDCC9", "", "\uDBB9\uDD4C", ["chart_with_downwards_trend"], 17, 26],
        "1f4ca": ["\uD83D\uDCCA", "\uE14A", "\uDBB9\uDD4A", ["bar_chart"], 17, 27],
        "1f4cb": ["\uD83D\uDCCB", "\uE301", "\uDBB9\uDD48", ["clipboard"], 17, 28],
        "1f4cc": ["\uD83D\uDCCC", "", "\uDBB9\uDD4E", ["pushpin"], 17, 29],
        "1f4cd": ["\uD83D\uDCCD", "", "\uDBB9\uDD3F", ["round_pushpin"], 18, 0],
        "1f4ce": ["\uD83D\uDCCE", "", "\uDBB9\uDD3A", ["paperclip"], 18, 1],
        "1f4cf": ["\uD83D\uDCCF", "", "\uDBB9\uDD50", ["straight_ruler"], 18, 2],
        "1f4d0": ["\uD83D\uDCD0", "", "\uDBB9\uDD51", ["triangular_ruler"], 18, 3],
        "1f4d1": ["\uD83D\uDCD1", "\uE301", "\uDBB9\uDD52", ["bookmark_tabs"], 18, 4],
        "1f4d2": ["\uD83D\uDCD2", "\uE148", "\uDBB9\uDD4F", ["ledger"], 18, 5],
        "1f4d3": ["\uD83D\uDCD3", "\uE148", "\uDBB9\uDD45", ["notebook"], 18, 6],
        "1f4d4": ["\uD83D\uDCD4", "\uE148", "\uDBB9\uDD47", ["notebook_with_decorative_cover"], 18, 7],
        "1f4d5": ["\uD83D\uDCD5", "\uE148", "\uDBB9\uDD02", ["closed_book"], 18, 8],
        "1f4d6": ["\uD83D\uDCD6", "\uE148", "\uDBB9\uDD46", ["book", "open_book"], 18, 9],
        "1f4d7": ["\uD83D\uDCD7", "\uE148", "\uDBB9\uDCFF", ["green_book"], 18, 10],
        "1f4d8": ["\uD83D\uDCD8", "\uE148", "\uDBB9\uDD00", ["blue_book"], 18, 11],
        "1f4d9": ["\uD83D\uDCD9", "\uE148", "\uDBB9\uDD01", ["orange_book"], 18, 12],
        "1f4da": ["\uD83D\uDCDA", "\uE148", "\uDBB9\uDD03", ["books"], 18, 13],
        "1f4db": ["\uD83D\uDCDB", "", "\uDBB9\uDD04", ["name_badge"], 18, 14],
        "1f4dc": ["\uD83D\uDCDC", "", "\uDBB9\uDCFD", ["scroll"], 18, 15],
        "1f4dd": ["\uD83D\uDCDD", "\uE301", "\uDBB9\uDD27", ["memo", "pencil"], 18, 16],
        "1f4de": ["\uD83D\uDCDE", "\uE009", "\uDBB9\uDD24", ["telephone_receiver"], 18, 17],
        "1f4df": ["\uD83D\uDCDF", "", "\uDBB9\uDD22", ["pager"], 18, 18],
        "1f4e0": ["\uD83D\uDCE0", "\uE00B", "\uDBB9\uDD28", ["fax"], 18, 19],
        "1f4e1": ["\uD83D\uDCE1", "\uE14B", "\uDBB9\uDD31", ["satellite"], 18, 20],
        "1f4e2": ["\uD83D\uDCE2", "\uE142", "\uDBB9\uDD2F", ["loudspeaker"], 18, 21],
        "1f4e3": ["\uD83D\uDCE3", "\uE317", "\uDBB9\uDD30", ["mega"], 18, 22],
        "1f4e4": ["\uD83D\uDCE4", "", "\uDBB9\uDD33", ["outbox_tray"], 18, 23],
        "1f4e5": ["\uD83D\uDCE5", "", "\uDBB9\uDD34", ["inbox_tray"], 18, 24],
        "1f4e6": ["\uD83D\uDCE6", "\uE112", "\uDBB9\uDD35", ["package"], 18, 25],
        "1f4e7": ["\uD83D\uDCE7", "\uE103", "\uDBBA\uDF92", ["e-mail"], 18, 26],
        "1f4e8": ["\uD83D\uDCE8", "\uE103", "\uDBB9\uDD2A", ["incoming_envelope"], 18, 27],
        "1f4e9": ["\uD83D\uDCE9", "\uE103", "\uDBB9\uDD2B", ["envelope_with_arrow"], 18, 28],
        "1f4ea": ["\uD83D\uDCEA", "\uE101", "\uDBB9\uDD2C", ["mailbox_closed"], 18, 29],
        "1f4eb": ["\uD83D\uDCEB", "\uE101", "\uDBB9\uDD2D", ["mailbox"], 19, 0],
        "1f4ec": ["\uD83D\uDCEC", "", "", ["mailbox_with_mail"], 19, 1],
        "1f4ed": ["\uD83D\uDCED", "", "", ["mailbox_with_no_mail"], 19, 2],
        "1f4ee": ["\uD83D\uDCEE", "\uE102", "\uDBB9\uDD2E", ["postbox"], 19, 3],
        "1f4ef": ["\uD83D\uDCEF", "", "", ["postal_horn"], 19, 4],
        "1f4f0": ["\uD83D\uDCF0", "", "\uDBBA\uDC22", ["newspaper"], 19, 5],
        "1f4f1": ["\uD83D\uDCF1", "\uE00A", "\uDBB9\uDD25", ["iphone"], 19, 6],
        "1f4f2": ["\uD83D\uDCF2", "\uE104", "\uDBB9\uDD26", ["calling"], 19, 7],
        "1f4f3": ["\uD83D\uDCF3", "\uE250", "\uDBBA\uDC39", ["vibration_mode"], 19, 8],
        "1f4f4": ["\uD83D\uDCF4", "\uE251", "\uDBBA\uDC3A", ["mobile_phone_off"], 19, 9],
        "1f4f5": ["\uD83D\uDCF5", "", "", ["no_mobile_phones"], 19, 10],
        "1f4f6": ["\uD83D\uDCF6", "\uE20B", "\uDBBA\uDC38", ["signal_strength"], 19, 11],
        "1f4f7": ["\uD83D\uDCF7", "\uE008", "\uDBB9\uDCEF", ["camera"], 19, 12],
        "1f4f9": ["\uD83D\uDCF9", "\uE03D", "\uDBB9\uDCF9", ["video_camera"], 19, 13],
        "1f4fa": ["\uD83D\uDCFA", "\uE12A", "\uDBBA\uDC1C", ["tv"], 19, 14],
        "1f4fb": ["\uD83D\uDCFB", "\uE128", "\uDBBA\uDC1F", ["radio"], 19, 15],
        "1f4fc": ["\uD83D\uDCFC", "\uE129", "\uDBBA\uDC20", ["vhs"], 19, 16],
        "1f500": ["\uD83D\uDD00", "", "", ["twisted_rightwards_arrows"], 19, 17],
        "1f501": ["\uD83D\uDD01", "", "", ["repeat"], 19, 18],
        "1f502": ["\uD83D\uDD02", "", "", ["repeat_one"], 19, 19],
        "1f503": ["\uD83D\uDD03", "", "\uDBBA\uDF91", ["arrows_clockwise"], 19, 20],
        "1f504": ["\uD83D\uDD04", "", "", ["arrows_counterclockwise"], 19, 21],
        "1f505": ["\uD83D\uDD05", "", "", ["low_brightness"], 19, 22],
        "1f506": ["\uD83D\uDD06", "", "", ["high_brightness"], 19, 23],
        "1f507": ["\uD83D\uDD07", "", "", ["mute"], 19, 24],
        "1f508": ["\uD83D\uDD08", "", "", ["speaker"], 19, 25],
        "1f509": ["\uD83D\uDD09", "", "", ["sound"], 19, 26],
        "1f50a": ["\uD83D\uDD0A", "\uE141", "\uDBBA\uDC21", ["loud_sound"], 19, 27],
        "1f50b": ["\uD83D\uDD0B", "", "\uDBB9\uDCFC", ["battery"], 19, 28],
        "1f50c": ["\uD83D\uDD0C", "", "\uDBB9\uDCFE", ["electric_plug"], 19, 29],
        "1f50d": ["\uD83D\uDD0D", "\uE114", "\uDBBA\uDF85", ["mag"], 20, 0],
        "1f50e": ["\uD83D\uDD0E", "\uE114", "\uDBBA\uDF8D", ["mag_right"], 20, 1],
        "1f50f": ["\uD83D\uDD0F", "\uE144", "\uDBBA\uDF90", ["lock_with_ink_pen"], 20, 2],
        "1f510": ["\uD83D\uDD10", "\uE144", "\uDBBA\uDF8A", ["closed_lock_with_key"], 20, 3],
        "1f511": ["\uD83D\uDD11", "\uE03F", "\uDBBA\uDF82", ["key"], 20, 4],
        "1f512": ["\uD83D\uDD12", "\uE144", "\uDBBA\uDF86", ["lock"], 20, 5],
        "1f513": ["\uD83D\uDD13", "\uE145", "\uDBBA\uDF87", ["unlock"], 20, 6],
        "1f514": ["\uD83D\uDD14", "\uE325", "\uDBB9\uDCF2", ["bell"], 20, 7],
        "1f515": ["\uD83D\uDD15", "", "", ["no_bell"], 20, 8],
        "1f516": ["\uD83D\uDD16", "", "\uDBBA\uDF8F", ["bookmark"], 20, 9],
        "1f517": ["\uD83D\uDD17", "", "\uDBBA\uDF4B", ["link"], 20, 10],
        "1f518": ["\uD83D\uDD18", "", "\uDBBA\uDF8C", ["radio_button"], 20, 11],
        "1f519": ["\uD83D\uDD19", "\uE235", "\uDBBA\uDF8E", ["back"], 20, 12],
        "1f51a": ["\uD83D\uDD1A", "", "\uDBB8\uDC1A", ["end"], 20, 13],
        "1f51b": ["\uD83D\uDD1B", "", "\uDBB8\uDC19", ["on"], 20, 14],
        "1f51c": ["\uD83D\uDD1C", "", "\uDBB8\uDC18", ["soon"], 20, 15],
        "1f51d": ["\uD83D\uDD1D", "\uE24C", "\uDBBA\uDF42", ["top"], 20, 16],
        "1f51e": ["\uD83D\uDD1E", "\uE207", "\uDBBA\uDF25", ["underage"], 20, 17],
        "1f51f": ["\uD83D\uDD1F", "", "\uDBBA\uDC3B", ["keycap_ten"], 20, 18],
        "1f520": ["\uD83D\uDD20", "", "\uDBBA\uDF7C", ["capital_abcd"], 20, 19],
        "1f521": ["\uD83D\uDD21", "", "\uDBBA\uDF7D", ["abcd"], 20, 20],
        "1f522": ["\uD83D\uDD22", "", "\uDBBA\uDF7E", ["1234"], 20, 21],
        "1f523": ["\uD83D\uDD23", "", "\uDBBA\uDF7F", ["symbols"], 20, 22],
        "1f524": ["\uD83D\uDD24", "", "\uDBBA\uDF80", ["abc"], 20, 23],
        "1f525": ["\uD83D\uDD25", "\uE11D", "\uDBB9\uDCF6", ["fire"], 20, 24],
        "1f526": ["\uD83D\uDD26", "", "\uDBB9\uDCFB", ["flashlight"], 20, 25],
        "1f527": ["\uD83D\uDD27", "", "\uDBB9\uDCC9", ["wrench"], 20, 26],
        "1f528": ["\uD83D\uDD28", "\uE116", "\uDBB9\uDCCA", ["hammer"], 20, 27],
        "1f529": ["\uD83D\uDD29", "", "\uDBB9\uDCCB", ["nut_and_bolt"], 20, 28],
        "1f52a": ["\uD83D\uDD2A", "", "\uDBB9\uDCFA", ["hocho", "knife"], 20, 29],
        "1f52b": ["\uD83D\uDD2B", "\uE113", "\uDBB9\uDCF5", ["gun"], 21, 0],
        "1f52c": ["\uD83D\uDD2C", "", "", ["microscope"], 21, 1],
        "1f52d": ["\uD83D\uDD2D", "", "", ["telescope"], 21, 2],
        "1f52e": ["\uD83D\uDD2E", "\uE23E", "\uDBB9\uDCF7", ["crystal_ball"], 21, 3],
        "1f52f": ["\uD83D\uDD2F", "\uE23E", "\uDBB9\uDCF8", ["six_pointed_star"], 21, 4],
        "1f530": ["\uD83D\uDD30", "\uE209", "\uDBB8\uDC44", ["beginner"], 21, 5],
        "1f531": ["\uD83D\uDD31", "\uE031", "\uDBB9\uDCD2", ["trident"], 21, 6],
        "1f532": ["\uD83D\uDD32", "\uE21A", "\uDBBA\uDF64", ["black_square_button"], 21, 7],
        "1f533": ["\uD83D\uDD33", "\uE21B", "\uDBBA\uDF67", ["white_square_button"], 21, 8],
        "1f534": ["\uD83D\uDD34", "\uE219", "\uDBBA\uDF63", ["red_circle"], 21, 9],
        "1f535": ["\uD83D\uDD35", "\uE21A", "\uDBBA\uDF64", ["large_blue_circle"], 21, 10],
        "1f536": ["\uD83D\uDD36", "\uE21B", "\uDBBA\uDF73", ["large_orange_diamond"], 21, 11],
        "1f537": ["\uD83D\uDD37", "\uE21B", "\uDBBA\uDF74", ["large_blue_diamond"], 21, 12],
        "1f538": ["\uD83D\uDD38", "\uE21B", "\uDBBA\uDF75", ["small_orange_diamond"], 21, 13],
        "1f539": ["\uD83D\uDD39", "\uE21B", "\uDBBA\uDF76", ["small_blue_diamond"], 21, 14],
        "1f53a": ["\uD83D\uDD3A", "", "\uDBBA\uDF78", ["small_red_triangle"], 21, 15],
        "1f53b": ["\uD83D\uDD3B", "", "\uDBBA\uDF79", ["small_red_triangle_down"], 21, 16],
        "1f53c": ["\uD83D\uDD3C", "", "\uDBBA\uDF01", ["arrow_up_small"], 21, 17],
        "1f53d": ["\uD83D\uDD3D", "", "\uDBBA\uDF00", ["arrow_down_small"], 21, 18],
        "1f550": ["\uD83D\uDD50", "\uE024", "\uDBB8\uDC1E", ["clock1"], 21, 19],
        "1f551": ["\uD83D\uDD51", "\uE025", "\uDBB8\uDC1F", ["clock2"], 21, 20],
        "1f552": ["\uD83D\uDD52", "\uE026", "\uDBB8\uDC20", ["clock3"], 21, 21],
        "1f553": ["\uD83D\uDD53", "\uE027", "\uDBB8\uDC21", ["clock4"], 21, 22],
        "1f554": ["\uD83D\uDD54", "\uE028", "\uDBB8\uDC22", ["clock5"], 21, 23],
        "1f555": ["\uD83D\uDD55", "\uE029", "\uDBB8\uDC23", ["clock6"], 21, 24],
        "1f556": ["\uD83D\uDD56", "\uE02A", "\uDBB8\uDC24", ["clock7"], 21, 25],
        "1f557": ["\uD83D\uDD57", "\uE02B", "\uDBB8\uDC25", ["clock8"], 21, 26],
        "1f558": ["\uD83D\uDD58", "\uE02C", "\uDBB8\uDC26", ["clock9"], 21, 27],
        "1f559": ["\uD83D\uDD59", "\uE02D", "\uDBB8\uDC27", ["clock10"], 21, 28],
        "1f55a": ["\uD83D\uDD5A", "\uE02E", "\uDBB8\uDC28", ["clock11"], 21, 29],
        "1f55b": ["\uD83D\uDD5B", "\uE02F", "\uDBB8\uDC29", ["clock12"], 22, 0],
        "1f55c": ["\uD83D\uDD5C", "", "", ["clock130"], 22, 1],
        "1f55d": ["\uD83D\uDD5D", "", "", ["clock230"], 22, 2],
        "1f55e": ["\uD83D\uDD5E", "", "", ["clock330"], 22, 3],
        "1f55f": ["\uD83D\uDD5F", "", "", ["clock430"], 22, 4],
        "1f560": ["\uD83D\uDD60", "", "", ["clock530"], 22, 5],
        "1f561": ["\uD83D\uDD61", "", "", ["clock630"], 22, 6],
        "1f562": ["\uD83D\uDD62", "", "", ["clock730"], 22, 7],
        "1f563": ["\uD83D\uDD63", "", "", ["clock830"], 22, 8],
        "1f564": ["\uD83D\uDD64", "", "", ["clock930"], 22, 9],
        "1f565": ["\uD83D\uDD65", "", "", ["clock1030"], 22, 10],
        "1f566": ["\uD83D\uDD66", "", "", ["clock1130"], 22, 11],
        "1f567": ["\uD83D\uDD67", "", "", ["clock1230"], 22, 12],
        "1f5fb": ["\uD83D\uDDFB", "\uE03B", "\uDBB9\uDCC3", ["mount_fuji"], 22, 13],
        "1f5fc": ["\uD83D\uDDFC", "\uE509", "\uDBB9\uDCC4", ["tokyo_tower"], 22, 14],
        "1f5fd": ["\uD83D\uDDFD", "\uE51D", "\uDBB9\uDCC6", ["statue_of_liberty"], 22, 15],
        "1f5fe": ["\uD83D\uDDFE", "", "\uDBB9\uDCC7", ["japan"], 22, 16],
        "1f5ff": ["\uD83D\uDDFF", "", "\uDBB9\uDCC8", ["moyai"], 22, 17],
        "1f600": ["\uD83D\uDE00", "", "", ["grinning"], 22, 18, ":D"],
        "1f601": ["\uD83D\uDE01", "\uE404", "\uDBB8\uDF33", ["grin"], 22, 19],
        "1f602": ["\uD83D\uDE02", "\uE412", "\uDBB8\uDF34", ["joy"], 22, 20],
        "1f603": ["\uD83D\uDE03", "\uE057", "\uDBB8\uDF30", ["smiley"], 22, 21, ":)"],
        "1f604": ["\uD83D\uDE04", "\uE415", "\uDBB8\uDF38", ["smile"], 22, 22, ":)"],
        "1f605": ["\uD83D\uDE05", "\uE415\uE331", "\uDBB8\uDF31", ["sweat_smile"], 22, 23],
        "1f606": ["\uD83D\uDE06", "\uE40A", "\uDBB8\uDF32", ["laughing", "satisfied"], 22, 24],
        "1f607": ["\uD83D\uDE07", "", "", ["innocent"], 22, 25],
        "1f608": ["\uD83D\uDE08", "", "", ["smiling_imp"], 22, 26],
        "1f609": ["\uD83D\uDE09", "\uE405", "\uDBB8\uDF47", ["wink"], 22, 27, ";)"],
        "1f60a": ["\uD83D\uDE0A", "\uE056", "\uDBB8\uDF35", ["blush"], 22, 28],
        "1f60b": ["\uD83D\uDE0B", "\uE056", "\uDBB8\uDF2B", ["yum"], 22, 29],
        "1f60c": ["\uD83D\uDE0C", "\uE40A", "\uDBB8\uDF3E", ["relieved"], 23, 0],
        "1f60d": ["\uD83D\uDE0D", "\uE106", "\uDBB8\uDF27", ["heart_eyes"], 23, 1],
        "1f60e": ["\uD83D\uDE0E", "", "", ["sunglasses"], 23, 2],
        "1f60f": ["\uD83D\uDE0F", "\uE402", "\uDBB8\uDF43", ["smirk"], 23, 3],
        "1f610": ["\uD83D\uDE10", "", "", ["neutral_face"], 23, 4],
        "1f611": ["\uD83D\uDE11", "", "", ["expressionless"], 23, 5],
        "1f612": ["\uD83D\uDE12", "\uE40E", "\uDBB8\uDF26", ["unamused"], 23, 6],
        "1f613": ["\uD83D\uDE13", "\uE108", "\uDBB8\uDF44", ["sweat"], 23, 7],
        "1f614": ["\uD83D\uDE14", "\uE403", "\uDBB8\uDF40", ["pensive"], 23, 8],
        "1f615": ["\uD83D\uDE15", "", "", ["confused"], 23, 9],
        "1f616": ["\uD83D\uDE16", "\uE407", "\uDBB8\uDF3F", ["confounded"], 23, 10],
        "1f617": ["\uD83D\uDE17", "", "", ["kissing"], 23, 11],
        "1f618": ["\uD83D\uDE18", "\uE418", "\uDBB8\uDF2C", ["kissing_heart"], 23, 12],
        "1f619": ["\uD83D\uDE19", "", "", ["kissing_smiling_eyes"], 23, 13],
        "1f61a": ["\uD83D\uDE1A", "\uE417", "\uDBB8\uDF2D", ["kissing_closed_eyes"], 23, 14],
        "1f61b": ["\uD83D\uDE1B", "", "", ["stuck_out_tongue"], 23, 15, ":p"],
        "1f61c": ["\uD83D\uDE1C", "\uE105", "\uDBB8\uDF29", ["stuck_out_tongue_winking_eye"], 23, 16, ";p"],
        "1f61d": ["\uD83D\uDE1D", "\uE409", "\uDBB8\uDF2A", ["stuck_out_tongue_closed_eyes"], 23, 17],
        "1f61e": ["\uD83D\uDE1E", "\uE058", "\uDBB8\uDF23", ["disappointed"], 23, 18, ":("],
        "1f61f": ["\uD83D\uDE1F", "", "", ["worried"], 23, 19],
        "1f620": ["\uD83D\uDE20", "\uE059", "\uDBB8\uDF20", ["angry"], 23, 20],
        "1f621": ["\uD83D\uDE21", "\uE416", "\uDBB8\uDF3D", ["rage"], 23, 21],
        "1f622": ["\uD83D\uDE22", "\uE413", "\uDBB8\uDF39", ["cry"], 23, 22, ":'("],
        "1f623": ["\uD83D\uDE23", "\uE406", "\uDBB8\uDF3C", ["persevere"], 23, 23],
        "1f624": ["\uD83D\uDE24", "\uE404", "\uDBB8\uDF28", ["triumph"], 23, 24],
        "1f625": ["\uD83D\uDE25", "\uE401", "\uDBB8\uDF45", ["disappointed_relieved"], 23, 25],
        "1f626": ["\uD83D\uDE26", "", "", ["frowning"], 23, 26],
        "1f627": ["\uD83D\uDE27", "", "", ["anguished"], 23, 27],
        "1f628": ["\uD83D\uDE28", "\uE40B", "\uDBB8\uDF3B", ["fearful"], 23, 28],
        "1f629": ["\uD83D\uDE29", "\uE403", "\uDBB8\uDF21", ["weary"], 23, 29],
        "1f62a": ["\uD83D\uDE2A", "\uE408", "\uDBB8\uDF42", ["sleepy"], 24, 0],
        "1f62b": ["\uD83D\uDE2B", "\uE406", "\uDBB8\uDF46", ["tired_face"], 24, 1],
        "1f62c": ["\uD83D\uDE2C", "", "", ["grimacing"], 24, 2],
        "1f62d": ["\uD83D\uDE2D", "\uE411", "\uDBB8\uDF3A", ["sob"], 24, 3, ":'("],
        "1f62e": ["\uD83D\uDE2E", "", "", ["open_mouth"], 24, 4],
        "1f62f": ["\uD83D\uDE2F", "", "", ["hushed"], 24, 5],
        "1f630": ["\uD83D\uDE30", "\uE40F", "\uDBB8\uDF25", ["cold_sweat"], 24, 6],
        "1f631": ["\uD83D\uDE31", "\uE107", "\uDBB8\uDF41", ["scream"], 24, 7],
        "1f632": ["\uD83D\uDE32", "\uE410", "\uDBB8\uDF22", ["astonished"], 24, 8],
        "1f633": ["\uD83D\uDE33", "\uE40D", "\uDBB8\uDF2F", ["flushed"], 24, 9],
        "1f634": ["\uD83D\uDE34", "", "", ["sleeping"], 24, 10],
        "1f635": ["\uD83D\uDE35", "\uE406", "\uDBB8\uDF24", ["dizzy_face"], 24, 11],
        "1f636": ["\uD83D\uDE36", "", "", ["no_mouth"], 24, 12],
        "1f637": ["\uD83D\uDE37", "\uE40C", "\uDBB8\uDF2E", ["mask"], 24, 13],
        "1f638": ["\uD83D\uDE38", "\uE404", "\uDBB8\uDF49", ["smile_cat"], 24, 14],
        "1f639": ["\uD83D\uDE39", "\uE412", "\uDBB8\uDF4A", ["joy_cat"], 24, 15],
        "1f63a": ["\uD83D\uDE3A", "\uE057", "\uDBB8\uDF48", ["smiley_cat"], 24, 16],
        "1f63b": ["\uD83D\uDE3B", "\uE106", "\uDBB8\uDF4C", ["heart_eyes_cat"], 24, 17],
        "1f63c": ["\uD83D\uDE3C", "\uE404", "\uDBB8\uDF4F", ["smirk_cat"], 24, 18],
        "1f63d": ["\uD83D\uDE3D", "\uE418", "\uDBB8\uDF4B", ["kissing_cat"], 24, 19],
        "1f63e": ["\uD83D\uDE3E", "\uE416", "\uDBB8\uDF4E", ["pouting_cat"], 24, 20],
        "1f63f": ["\uD83D\uDE3F", "\uE413", "\uDBB8\uDF4D", ["crying_cat_face"], 24, 21],
        "1f640": ["\uD83D\uDE40", "\uE403", "\uDBB8\uDF50", ["scream_cat"], 24, 22],
        "1f645": ["\uD83D\uDE45", "\uE423", "\uDBB8\uDF51", ["no_good"], 24, 23],
        "1f646": ["\uD83D\uDE46", "\uE424", "\uDBB8\uDF52", ["ok_woman"], 24, 24],
        "1f647": ["\uD83D\uDE47", "\uE426", "\uDBB8\uDF53", ["bow"], 24, 25],
        "1f648": ["\uD83D\uDE48", "", "\uDBB8\uDF54", ["see_no_evil"], 24, 26],
        "1f649": ["\uD83D\uDE49", "", "\uDBB8\uDF56", ["hear_no_evil"], 24, 27],
        "1f64a": ["\uD83D\uDE4A", "", "\uDBB8\uDF55", ["speak_no_evil"], 24, 28],
        "1f64b": ["\uD83D\uDE4B", "\uE012", "\uDBB8\uDF57", ["raising_hand"], 24, 29],
        "1f64c": ["\uD83D\uDE4C", "\uE427", "\uDBB8\uDF58", ["raised_hands"], 25, 0],
        "1f64d": ["\uD83D\uDE4D", "\uE403", "\uDBB8\uDF59", ["person_frowning"], 25, 1],
        "1f64e": ["\uD83D\uDE4E", "\uE416", "\uDBB8\uDF5A", ["person_with_pouting_face"], 25, 2],
        "1f64f": ["\uD83D\uDE4F", "\uE41D", "\uDBB8\uDF5B", ["pray"], 25, 3],
        "1f680": ["\uD83D\uDE80", "\uE10D", "\uDBB9\uDFED", ["rocket"], 25, 4],
        "1f681": ["\uD83D\uDE81", "", "", ["helicopter"], 25, 5],
        "1f682": ["\uD83D\uDE82", "", "", ["steam_locomotive"], 25, 6],
        "1f683": ["\uD83D\uDE83", "\uE01E", "\uDBB9\uDFDF", ["railway_car"], 25, 7],
        "1f684": ["\uD83D\uDE84", "\uE435", "\uDBB9\uDFE2", ["bullettrain_side"], 25, 8],
        "1f685": ["\uD83D\uDE85", "\uE01F", "\uDBB9\uDFE3", ["bullettrain_front"], 25, 9],
        "1f686": ["\uD83D\uDE86", "", "", ["train2"], 25, 10],
        "1f687": ["\uD83D\uDE87", "\uE434", "\uDBB9\uDFE0", ["metro"], 25, 11],
        "1f688": ["\uD83D\uDE88", "", "", ["light_rail"], 25, 12],
        "1f689": ["\uD83D\uDE89", "\uE039", "\uDBB9\uDFEC", ["station"], 25, 13],
        "1f68a": ["\uD83D\uDE8A", "", "", ["tram"], 25, 14],
        "1f68b": ["\uD83D\uDE8B", "", "", ["train"], 25, 15],
        "1f68c": ["\uD83D\uDE8C", "\uE159", "\uDBB9\uDFE6", ["bus"], 25, 16],
        "1f68d": ["\uD83D\uDE8D", "", "", ["oncoming_bus"], 25, 17],
        "1f68e": ["\uD83D\uDE8E", "", "", ["trolleybus"], 25, 18],
        "1f68f": ["\uD83D\uDE8F", "\uE150", "\uDBB9\uDFE7", ["busstop"], 25, 19],
        "1f690": ["\uD83D\uDE90", "", "", ["minibus"], 25, 20],
        "1f691": ["\uD83D\uDE91", "\uE431", "\uDBB9\uDFF3", ["ambulance"], 25, 21],
        "1f692": ["\uD83D\uDE92", "\uE430", "\uDBB9\uDFF2", ["fire_engine"], 25, 22],
        "1f693": ["\uD83D\uDE93", "\uE432", "\uDBB9\uDFF4", ["police_car"], 25, 23],
        "1f694": ["\uD83D\uDE94", "", "", ["oncoming_police_car"], 25, 24],
        "1f695": ["\uD83D\uDE95", "\uE15A", "\uDBB9\uDFEF", ["taxi"], 25, 25],
        "1f696": ["\uD83D\uDE96", "", "", ["oncoming_taxi"], 25, 26],
        "1f697": ["\uD83D\uDE97", "\uE01B", "\uDBB9\uDFE4", ["car", "red_car"], 25, 27],
        "1f698": ["\uD83D\uDE98", "", "", ["oncoming_automobile"], 25, 28],
        "1f699": ["\uD83D\uDE99", "\uE42E", "\uDBB9\uDFE5", ["blue_car"], 25, 29],
        "1f69a": ["\uD83D\uDE9A", "\uE42F", "\uDBB9\uDFF1", ["truck"], 26, 0],
        "1f69b": ["\uD83D\uDE9B", "", "", ["articulated_lorry"], 26, 1],
        "1f69c": ["\uD83D\uDE9C", "", "", ["tractor"], 26, 2],
        "1f69d": ["\uD83D\uDE9D", "", "", ["monorail"], 26, 3],
        "1f69e": ["\uD83D\uDE9E", "", "", ["mountain_railway"], 26, 4],
        "1f69f": ["\uD83D\uDE9F", "", "", ["suspension_railway"], 26, 5],
        "1f6a0": ["\uD83D\uDEA0", "", "", ["mountain_cableway"], 26, 6],
        "1f6a1": ["\uD83D\uDEA1", "", "", ["aerial_tramway"], 26, 7],
        "1f6a2": ["\uD83D\uDEA2", "\uE202", "\uDBB9\uDFE8", ["ship"], 26, 8],
        "1f6a3": ["\uD83D\uDEA3", "", "", ["rowboat"], 26, 9],
        "1f6a4": ["\uD83D\uDEA4", "\uE135", "\uDBB9\uDFEE", ["speedboat"], 26, 10],
        "1f6a5": ["\uD83D\uDEA5", "\uE14E", "\uDBB9\uDFF7", ["traffic_light"], 26, 11],
        "1f6a6": ["\uD83D\uDEA6", "", "", ["vertical_traffic_light"], 26, 12],
        "1f6a7": ["\uD83D\uDEA7", "\uE137", "\uDBB9\uDFF8", ["construction"], 26, 13],
        "1f6a8": ["\uD83D\uDEA8", "\uE432", "\uDBB9\uDFF9", ["rotating_light"], 26, 14],
        "1f6a9": ["\uD83D\uDEA9", "", "\uDBBA\uDF22", ["triangular_flag_on_post"], 26, 15],
        "1f6aa": ["\uD83D\uDEAA", "", "\uDBB9\uDCF3", ["door"], 26, 16],
        "1f6ab": ["\uD83D\uDEAB", "", "\uDBBA\uDF48", ["no_entry_sign"], 26, 17],
        "1f6ac": ["\uD83D\uDEAC", "\uE30E", "\uDBBA\uDF1E", ["smoking"], 26, 18],
        "1f6ad": ["\uD83D\uDEAD", "\uE208", "\uDBBA\uDF1F", ["no_smoking"], 26, 19],
        "1f6ae": ["\uD83D\uDEAE", "", "", ["put_litter_in_its_place"], 26, 20],
        "1f6af": ["\uD83D\uDEAF", "", "", ["do_not_litter"], 26, 21],
        "1f6b0": ["\uD83D\uDEB0", "", "", ["potable_water"], 26, 22],
        "1f6b1": ["\uD83D\uDEB1", "", "", ["non-potable_water"], 26, 23],
        "1f6b2": ["\uD83D\uDEB2", "\uE136", "\uDBB9\uDFEB", ["bike"], 26, 24],
        "1f6b3": ["\uD83D\uDEB3", "", "", ["no_bicycles"], 26, 25],
        "1f6b4": ["\uD83D\uDEB4", "", "", ["bicyclist"], 26, 26],
        "1f6b5": ["\uD83D\uDEB5", "", "", ["mountain_bicyclist"], 26, 27],
        "1f6b6": ["\uD83D\uDEB6", "\uE201", "\uDBB9\uDFF0", ["walking"], 26, 28],
        "1f6b7": ["\uD83D\uDEB7", "", "", ["no_pedestrians"], 26, 29],
        "1f6b8": ["\uD83D\uDEB8", "", "", ["children_crossing"], 27, 0],
        "1f6b9": ["\uD83D\uDEB9", "\uE138", "\uDBBA\uDF33", ["mens"], 27, 1],
        "1f6ba": ["\uD83D\uDEBA", "\uE139", "\uDBBA\uDF34", ["womens"], 27, 2],
        "1f6bb": ["\uD83D\uDEBB", "\uE151", "\uDBB9\uDD06", ["restroom"], 27, 3],
        "1f6bc": ["\uD83D\uDEBC", "\uE13A", "\uDBBA\uDF35", ["baby_symbol"], 27, 4],
        "1f6bd": ["\uD83D\uDEBD", "\uE140", "\uDBB9\uDD07", ["toilet"], 27, 5],
        "1f6be": ["\uD83D\uDEBE", "\uE309", "\uDBB9\uDD08", ["wc"], 27, 6],
        "1f6bf": ["\uD83D\uDEBF", "", "", ["shower"], 27, 7],
        "1f6c0": ["\uD83D\uDEC0", "\uE13F", "\uDBB9\uDD05", ["bath"], 27, 8],
        "1f6c1": ["\uD83D\uDEC1", "", "", ["bathtub"], 27, 9],
        "1f6c2": ["\uD83D\uDEC2", "", "", ["passport_control"], 27, 10],
        "1f6c3": ["\uD83D\uDEC3", "", "", ["customs"], 27, 11],
        "1f6c4": ["\uD83D\uDEC4", "", "", ["baggage_claim"], 27, 12],
        "1f6c5": ["\uD83D\uDEC5", "", "", ["left_luggage"], 27, 13],
        "0023": ["\u0023\u20E3", "\uE210", "\uDBBA\uDC2C", ["hash"], 27, 14],
        "0030": ["\u0030\u20E3", "\uE225", "\uDBBA\uDC37", ["zero"], 27, 15],
        "0031": ["\u0031\u20E3", "\uE21C", "\uDBBA\uDC2E", ["one"], 27, 16],
        "0032": ["\u0032\u20E3", "\uE21D", "\uDBBA\uDC2F", ["two"], 27, 17],
        "0033": ["\u0033\u20E3", "\uE21E", "\uDBBA\uDC30", ["three"], 27, 18],
        "0034": ["\u0034\u20E3", "\uE21F", "\uDBBA\uDC31", ["four"], 27, 19],
        "0035": ["\u0035\u20E3", "\uE220", "\uDBBA\uDC32", ["five"], 27, 20],
        "0036": ["\u0036\u20E3", "\uE221", "\uDBBA\uDC33", ["six"], 27, 21],
        "0037": ["\u0037\u20E3", "\uE222", "\uDBBA\uDC34", ["seven"], 27, 22],
        "0038": ["\u0038\u20E3", "\uE223", "\uDBBA\uDC35", ["eight"], 27, 23],
        "0039": ["\u0039\u20E3", "\uE224", "\uDBBA\uDC36", ["nine"], 27, 24],
        "1f1e8-1f1f3": ["\uD83C\uDDE8\uD83C\uDDF3", "\uE513", "\uDBB9\uDCED", ["cn"], 27, 25],
        "1f1e9-1f1ea": ["\uD83C\uDDE9\uD83C\uDDEA", "\uE50E", "\uDBB9\uDCE8", ["de"], 27, 26],
        "1f1ea-1f1f8": ["\uD83C\uDDEA\uD83C\uDDF8", "\uE511", "\uDBB9\uDCEB", ["es"], 27, 27],
        "1f1eb-1f1f7": ["\uD83C\uDDEB\uD83C\uDDF7", "\uE50D", "\uDBB9\uDCE7", ["fr"], 27, 28],
        "1f1ec-1f1e7": ["\uD83C\uDDEC\uD83C\uDDE7", "\uE510", "\uDBB9\uDCEA", ["gb", "uk"], 27, 29],
        "1f1ee-1f1f9": ["\uD83C\uDDEE\uD83C\uDDF9", "\uE50F", "\uDBB9\uDCE9", ["it"], 28, 0],
        "1f1ef-1f1f5": ["\uD83C\uDDEF\uD83C\uDDF5", "\uE50B", "\uDBB9\uDCE5", ["jp"], 28, 1],
        "1f1f0-1f1f7": ["\uD83C\uDDF0\uD83C\uDDF7", "\uE514", "\uDBB9\uDCEE", ["kr"], 28, 2],
        "1f1f7-1f1fa": ["\uD83C\uDDF7\uD83C\uDDFA", "\uE512", "\uDBB9\uDCEC", ["ru"], 28, 3],
        "1f1fa-1f1f8": ["\uD83C\uDDFA\uD83C\uDDF8", "\uE50C", "\uDBB9\uDCE6", ["us"], 28, 4]
    };
    a.emoticons_data = {
        "<3": "heart",
        "</3": "broken_heart",
        ":)": "grinning",
        "(:": "grinning",
        ":-)": "grinning",
        ":D": "smile",
        ":-D": "smile",
        ";)": "wink",
        ";-)": "wink",
        "):": "disappointed",
        ":(": "disappointed",
        ":-(": "disappointed",
        ":'(": "cry",
        "=)": "smiley",
        "=-)": "smiley",
        ":>": "laughing",
        ":->": "laughing",
        "8)": "sunglasses",
        ":\\": "confused",
        ":-\\": "confused",
        ":/": "confused",
        ":-/": "confused",
        ":|": "neutral_face",
        ":-|": "neutral_face",
        ":o": "open_mouth",
        ":-o": "open_mouth",
        ">:(": "angry",
        ">:-(": "angry",
        ":p": "stuck_out_tongue",
        ":-p": "stuck_out_tongue",
        ":P": "stuck_out_tongue",
        ":-P": "stuck_out_tongue",
        ":b": "stuck_out_tongue",
        ":-b": "stuck_out_tongue",
        ";p": "stuck_out_tongue_winking_eye",
        ";-p": "stuck_out_tongue_winking_eye",
        ";b": "stuck_out_tongue_winking_eye",
        ";-b": "stuck_out_tongue_winking_eye",
        ";P": "stuck_out_tongue_winking_eye",
        ";-P": "stuck_out_tongue_winking_eye",
        ":o)": "monkey_face",
        "D:": "anguished"
    };
    if (typeof exports === "object") {
        module.exports = a
    } else {
        if (typeof define === "function" && define.amd) {
            define(function() {
                return a
            })
        } else {
            this.emoji = a
        }
    }
}).call(function() {
    return this || (typeof window !== "undefined" ? window : global)
}());
(function() {
    var a;
    a = (function() {
        function b() {
            this.options_index = 0;
            this.parsed = []
        }
        b.prototype.add_node = function(c) {
            if (c.nodeName.toUpperCase() === "OPTGROUP") {
                return this.add_group(c)
            } else {
                return this.add_option(c)
            }
        };
        b.prototype.add_group = function(i) {
            var h, e, g, d, f, c;
            h = this.parsed.length;
            this.parsed.push({
                array_index: h,
                group: true,
                label: i.label,
                children: 0,
                disabled: i.disabled
            });
            f = i.childNodes;
            c = [];
            for (g = 0, d = f.length; g < d; g++) {
                e = f[g];
                c.push(this.add_option(e, h, i.disabled))
            }
            return c
        };
        b.prototype.add_option = function(d, e, c) {
            if (d.nodeName.toUpperCase() === "OPTION") {
                if (d.text !== "") {
                    if (e != null) {
                        this.parsed[e].children += 1
                    }
                    this.parsed.push({
                        array_index: this.parsed.length,
                        options_index: this.options_index,
                        value: d.value,
                        text: d.text,
                        html: d.innerHTML,
                        selected: d.selected,
                        disabled: c === true ? c : d.disabled,
                        group_array_index: e,
                        classes: d.className,
                        style: d.style.cssText
                    })
                } else {
                    this.parsed.push({
                        array_index: this.parsed.length,
                        options_index: this.options_index,
                        empty: true
                    })
                }
                return this.options_index += 1
            }
        };
        return b
    })();
    a.select_to_array = function(b) {
        var g, f, e, c, d;
        f = new a();
        d = b.childNodes;
        for (e = 0, c = d.length; e < c; e++) {
            g = d[e];
            f.add_node(g)
        }
        return f.parsed
    };
    this.SelectParser = a
}).call(this);
(function() {
    var b, a;
    a = this;
    b = (function() {
        function c(d, e) {
            this.form_field = d;
            this.options = e != null ? e : {};
            if (!c.browser_is_supported()) {
                return
            }
            this.is_multiple = this.form_field.multiple;
            if (!this.is_multiple) {
                this.options.multiple_always_open = false
            }
            this.set_default_text();
            this.set_default_values();
            this.setup();
            this.set_up_html();
            this.register_observers();
            this.finish_setup()
        }
        c.prototype.set_default_values = function() {
            var d = this;
            this.click_test_action = function(e) {
                return d.test_active_click(e)
            };
            this.activate_action = function(e) {
                return d.activate_field(e)
            };
            this.active_field = false;
            this.mouse_on_container = false;
            this.results_showing = false;
            this.result_highlighted = null;
            this.result_single_selected = null;
            this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
            this.disable_search_threshold = this.options.disable_search_threshold || 0;
            this.disable_search = this.options.disable_search || false;
            this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
            this.search_contains = this.options.search_contains || false;
            this.single_backstroke_delete = this.options.single_backstroke_delete || false;
            this.max_selected_options = this.options.max_selected_options || Infinity;
            this.optional_prefix = this.options.optional_prefix || null;
            return this.inherit_select_classes = this.options.inherit_select_classes || false
        };
        c.prototype.set_default_text = function() {
            if (this.form_field.getAttribute("data-placeholder")) {
                this.default_text = this.form_field.getAttribute("data-placeholder")
            } else {
                if (this.is_multiple) {
                    this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || c.default_multiple_text
                } else {
                    this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || c.default_single_text
                }
            }
            return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || c.default_no_result_text
        };
        c.prototype.mouse_enter = function() {
            return this.mouse_on_container = true
        };
        c.prototype.mouse_leave = function() {
            return this.mouse_on_container = false
        };
        c.prototype.input_focus = function(d) {
            var e = this;
            if (this.is_multiple) {
                if (!this.active_field) {
                    return setTimeout((function() {
                        return e.container_mousedown()
                    }), 50)
                }
            } else {
                if (!this.active_field) {
                    return this.activate_field()
                }
            }
        };
        c.prototype.input_blur = function(d) {
            var e = this;
            if (!this.mouse_on_container) {
                this.active_field = false;
                return setTimeout((function() {
                    return e.blur_test()
                }), 100)
            }
        };
        c.prototype.result_add_option = function(f) {
            var d, e;
            f.dom_id = this.container_id + "_o_" + f.array_index;
            d = f.selected && this.is_multiple ? [] : ["active-result"];
            if (!f.disabled) {
                if (f.selected) {
                    d.push("result-selected")
                }
                if (f.group_array_index != null) {
                    d.push("group-option")
                }
                if (f.classes !== "") {
                    d.push(f.classes)
                }
                e = f.style.cssText !== "" ? ' style="' + f.style + '"' : ""
            } else {
                d.push("chzn-disabled");
                e = 'disabled="disabled"'
            }
            return '<li id="' + f.dom_id + '" class="' + d.join(" ") + '"' + e + ">" + f.html + "</li>"
        };
        c.prototype.results_update_field = function() {
            this.set_default_text();
            if (!this.is_multiple) {
                this.results_reset_cleanup()
            }
            this.result_clear_highlight();
            this.result_single_selected = null;
            return this.results_build()
        };
        c.prototype.results_toggle = function() {
            if (this.results_showing) {
                return this.results_hide()
            } else {
                return this.results_show()
            }
        };
        c.prototype.results_search = function(d) {
            if (this.results_showing) {
                return this.winnow_results()
            } else {
                return this.results_show()
            }
        };
        c.prototype.choices_count = function() {
            var e, g, d, f;
            if (this.selected_option_count != null) {
                return this.selected_option_count
            }
            this.selected_option_count = 0;
            f = this.form_field.options;
            for (g = 0, d = f.length; g < d; g++) {
                e = f[g];
                if (e.selected) {
                    this.selected_option_count += 1
                }
            }
            return this.selected_option_count
        };
        c.prototype.choices_click = function(d) {
            d.preventDefault();
            if (!this.results_showing) {
                return this.results_show()
            }
        };
        c.prototype.keyup_checker = function(d) {
            var f, e;
            f = (e = d.which) != null ? e : d.keyCode;
            this.search_field_scale();
            switch (f) {
                case 8:
                    if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
                        return this.keydown_backstroke()
                    } else {
                        if (!this.pending_backstroke) {
                            this.result_clear_highlight();
                            return this.results_search()
                        }
                    }
                    break;
                case 13:
                    d.preventDefault();
                    if (this.results_showing) {
                        return this.result_select(d)
                    }
                    break;
                case 27:
                    if (this.results_showing) {
                        this.results_hide()
                    }
                    return true;
                case 9:
                case 38:
                case 40:
                case 16:
                case 91:
                case 17:
                    break;
                default:
                    return this.results_search()
            }
        };
        c.prototype.generate_field_id = function() {
            var d;
            d = this.generate_random_id();
            this.form_field.id = d;
            return d
        };
        c.prototype.generate_random_char = function() {
            var f, e, d;
            f = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            d = Math.floor(Math.random() * f.length);
            return e = f.substring(d, d + 1)
        };
        c.prototype.container_width = function() {
            if (this.options.width != null) {
                return this.options.width
            } else {
                return "" + this.form_field.offsetWidth + "px"
            }
        };
        c.browser_is_supported = function() {
            var d;
            if (window.navigator.appName === "Microsoft Internet Explorer") {
                return (null !== (d = document.documentMode) && d >= 8)
            }
            return true
        };
        c.default_multiple_text = "Select Some Options";
        c.default_single_text = "Select an Option";
        c.default_no_result_text = "No results match";
        return c
    })();
    a.AbstractChosen = b
}).call(this);
(function() {
    var d, e, a, b = {}.hasOwnProperty,
        c = function(i, g) {
            for (var f in g) {
                if (b.call(g, f)) {
                    i[f] = g[f]
                }
            }

            function h() {
                this.constructor = i
            }
            h.prototype = g.prototype;
            i.prototype = new h();
            i.__super__ = g.prototype;
            return i
        };
    a = this;
    d = jQuery;
    d.fn.extend({
        chosen: function(f) {
            if (!AbstractChosen.browser_is_supported()) {
                return this
            }
            return this.each(function(g) {
                var h;
                h = d(this);
                if (!h.hasClass("chzn-done")) {
                    return h.data("chosen", new e(this, f))
                }
            })
        }
    });
    e = (function(f) {
        c(g, f);

        function g() {
            return g.__super__.constructor.apply(this, arguments)
        }
        g.prototype.setup = function() {
            this.form_field_jq = d(this.form_field);
            this.current_selectedIndex = this.form_field.selectedIndex;
            return this.is_rtl = this.form_field_jq.hasClass("chzn-rtl")
        };
        g.prototype.finish_setup = function() {
            if (this.options.multiple_always_open) {
                var h = this;
                setTimeout(function() {
                    h.container_mousedown()
                }, 100)
            }
            return this.form_field_jq.addClass("chzn-done")
        };
        g.prototype.set_up_html = function() {
            var h, i;
            this.container_id = this.form_field.id.length ? this.form_field.id.replace(/[^\w]/g, "_") : this.generate_field_id();
            this.container_id += "_chzn";
            h = ["chzn-container"];
            h.push("chzn-container-" + (this.is_multiple ? "multi" : "single"));
            if (this.inherit_select_classes && this.form_field.className) {
                h.push(this.form_field.className)
            }
            if (this.is_rtl) {
                h.push("chzn-rtl")
            }
            i = {
                id: this.container_id,
                "class": h.join(" "),
                style: "width: " + (this.container_width()) + ";",
                title: this.form_field.title
            };
            this.container = d("<div />", i);
            if (this.is_multiple) {
                this.container.html('<ul class="chzn-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chzn-drop"><ul class="chzn-results"></ul></div>')
            } else {
                this.container.html('<a href="javascript:void(0)" class="chzn-single chzn-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chzn-drop"><div class="chzn-search"><input type="text" autocomplete="off" /></div><ul class="chzn-results"></ul></div>')
            }
            this.form_field_jq.hide().after(this.container);
            this.dropdown = this.container.find("div.chzn-drop").first();
            this.search_field = this.container.find("input").first();
            this.search_results = this.container.find("ul.chzn-results").first();
            this.search_field_scale();
            this.search_no_results = this.container.find("li.no-results").first();
            if (this.is_multiple) {
                this.search_choices = this.container.find("ul.chzn-choices").first();
                this.search_container = this.container.find("li.search-field").first()
            } else {
                this.search_container = this.container.find("div.chzn-search").first();
                this.selected_item = this.container.find(".chzn-single").first()
            }
            this.results_build();
            this.set_tab_index();
            this.set_label_behavior();
            return this.form_field_jq.trigger("liszt:ready", {
                chosen: this
            })
        };
        g.prototype.register_observers = function() {
            var h = this;
            this.container.mousedown(function(i) {
                h.container_mousedown(i)
            });
            this.container.mouseup(function(i) {
                h.container_mouseup(i)
            });
            this.container.mouseenter(function(i) {
                h.mouse_enter(i)
            });
            this.container.mouseleave(function(i) {
                h.mouse_leave(i)
            });
            this.search_results.mouseup(function(i) {
                h.search_results_mouseup(i)
            });
            this.search_results.mouseover(function(i) {
                h.search_results_mouseover(i)
            });
            this.search_results.mouseout(function(i) {
                h.search_results_mouseout(i)
            });
            this.search_results.bind("mousewheel DOMMouseScroll", function(i) {
                h.search_results_mousewheel(i)
            });
            this.form_field_jq.bind("liszt:updated", function(i) {
                h.results_update_field(i)
            });
            this.form_field_jq.bind("liszt:activate", function(i) {
                h.activate_field(i)
            });
            this.form_field_jq.bind("liszt:open", function(i) {
                h.container_mousedown(i)
            });
            this.search_field.blur(function(i) {
                h.input_blur(i)
            });
            this.search_field.keyup(function(i) {
                h.keyup_checker(i)
            });
            this.search_field.keydown(function(i) {
                h.keydown_checker(i)
            });
            this.search_field.focus(function(i) {
                h.input_focus(i)
            });
            if (this.is_multiple) {
                return this.search_choices.click(function(i) {
                    h.choices_click(i)
                })
            } else {
                return this.container.click(function(i) {
                    i.preventDefault()
                })
            }
        };
        g.prototype.search_field_disabled = function() {
            this.is_disabled = this.form_field_jq[0].disabled;
            if (this.is_disabled) {
                this.container.addClass("chzn-disabled");
                this.search_field[0].disabled = true;
                if (!this.is_multiple) {
                    this.selected_item.unbind("focus", this.activate_action)
                }
                return this.close_field()
            } else {
                this.container.removeClass("chzn-disabled");
                this.search_field[0].disabled = false;
                if (!this.is_multiple) {
                    return this.selected_item.bind("focus", this.activate_action)
                }
            }
        };
        g.prototype.container_mousedown = function(h) {
            if (!this.is_disabled) {
                if (h && h.type === "mousedown" && !this.results_showing) {
                    h.preventDefault()
                }
                if (!((h != null) && (d(h.target)).hasClass("search-choice-close"))) {
                    if (!this.active_field) {
                        if (this.is_multiple) {
                            this.search_field.val("")
                        }
                        this.results_show()
                    } else {
                        if (!this.is_multiple && h && ((d(h.target)[0] === this.selected_item[0]) || d(h.target).parents("a.chzn-single").length)) {
                            h.preventDefault();
                            this.results_toggle()
                        }
                    }
                    return this.activate_field()
                }
            }
        };
        g.prototype.container_mouseup = function(h) {
            if (h.target.nodeName === "ABBR" && !this.is_disabled) {
                return this.results_reset(h)
            }
        };
        g.prototype.search_results_mousewheel = function(i) {
            var k, j, h;
            k = -((j = i.originalEvent) != null ? j.wheelDelta : void 0) || ((h = i.originialEvent) != null ? h.detail : void 0);
            if (k != null) {
                i.preventDefault();
                if (i.type === "DOMMouseScroll") {
                    k = k * 40
                }
                return this.search_results.scrollTop(k + this.search_results.scrollTop())
            }
        };
        g.prototype.blur_test = function(h) {
            if (!this.active_field && this.container.hasClass("chzn-container-active")) {
                return this.close_field()
            }
        };
        g.prototype.close_field = function() {
            d(document).unbind("click", this.click_test_action);
            this.active_field = false;
            this.results_hide();
            this.form_field_jq.trigger("blur");
            this.container.removeClass("chzn-container-active");
            this.winnow_results_clear();
            this.clear_backstroke();
            this.show_search_field_default();
            return this.search_field_scale()
        };
        g.prototype.activate_field = function() {
            this.form_field_jq.trigger("focus");
            this.container.addClass("chzn-container-active");
            this.active_field = true;
            this.search_field.val(this.search_field.val());
            return this.search_field.focus()
        };
        g.prototype.test_active_click = function(h) {
            if (d(h.target).parents("#" + this.container_id).length) {
                return this.active_field = true
            } else {
                return this.close_field()
            }
        };
        g.prototype.results_build = function() {
            var i, l, k, h, j;
            this.parsing = true;
            this.selected_option_count = null;
            this.results_data = a.SelectParser.select_to_array(this.form_field);
            if (this.is_multiple && this.choices_count() > 0) {
                this.search_choices.find("li.search-choice").remove()
            } else {
                if (!this.is_multiple) {
                    this.selected_item.addClass("chzn-default").find("span").text(this.default_text);
                    if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
                        this.container.addClass("chzn-container-single-nosearch")
                    } else {
                        this.container.removeClass("chzn-container-single-nosearch")
                    }
                }
            }
            i = "";
            j = this.results_data;
            for (k = 0, h = j.length; k < h; k++) {
                l = j[k];
                if (l.group) {
                    i += this.result_add_group(l)
                } else {
                    if (!l.empty) {
                        i += this.result_add_option(l);
                        if (l.selected && this.is_multiple) {
                            this.choice_build(l)
                        } else {
                            if (l.selected && !this.is_multiple) {
                                this.selected_item.removeClass("chzn-default").find("span").text(l.text);
                                if (this.allow_single_deselect) {
                                    this.single_deselect_control_build()
                                }
                            }
                        }
                    }
                }
            }
            this.search_field_disabled();
            this.show_search_field_default();
            this.search_field_scale();
            this.search_results.html(i);
            return this.parsing = false
        };
        g.prototype.result_add_group = function(h) {
            if (!h.disabled) {
                h.dom_id = this.container_id + "_g_" + h.array_index;
                return '<li id="' + h.dom_id + '" class="group-result">' + d("<div />").text(h.label).html() + "</li>"
            } else {
                return ""
            }
        };
        g.prototype.result_do_highlight = function(i) {
            var m, l, j, k, h;
            if (i.length) {
                this.result_clear_highlight();
                this.result_highlight = i;
                this.result_highlight.addClass("highlighted");
                j = parseInt(this.search_results.css("maxHeight"), 10);
                h = this.search_results.scrollTop();
                k = j + h;
                l = this.result_highlight.position().top + this.search_results.scrollTop();
                m = l + this.result_highlight.outerHeight();
                if (m >= k) {
                    return this.search_results.scrollTop((m - j) > 0 ? m - j : 0)
                } else {
                    if (l < h) {
                        return this.search_results.scrollTop(l)
                    }
                }
            }
        };
        g.prototype.result_clear_highlight = function() {
            if (this.result_highlight) {
                this.result_highlight.removeClass("highlighted")
            }
            return this.result_highlight = null
        };
        g.prototype.results_show = function() {
            if (this.result_single_selected != null) {
                this.result_do_highlight(this.result_single_selected)
            } else {
                if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
                    this.form_field_jq.trigger("liszt:maxselected", {
                        chosen: this
                    });
                    return false
                }
            }
            this.container.addClass("chzn-with-drop");
            this.form_field_jq.trigger("liszt:showing_dropdown", {
                chosen: this
            });
            this.results_showing = true;
            this.search_field.focus();
            this.search_field.val(this.search_field.val());
            return this.winnow_results()
        };
        g.prototype.results_hide = function() {
            if (this.options.multiple_always_open) {
                return
            }
            this.result_clear_highlight();
            this.container.removeClass("chzn-with-drop");
            this.form_field_jq.trigger("liszt:hiding_dropdown", {
                chosen: this
            });
            return this.results_showing = false
        };
        g.prototype.set_tab_index = function(i) {
            var h;
            if (this.form_field_jq.attr("tabindex")) {
                h = this.form_field_jq.attr("tabindex");
                this.form_field_jq.attr("tabindex", -1);
                return this.search_field.attr("tabindex", h)
            }
        };
        g.prototype.set_label_behavior = function() {
            var h = this;
            this.form_field_label = this.form_field_jq.parents("label");
            if (!this.form_field_label.length && this.form_field.id.length) {
                this.form_field_label = d("label[for=" + this.form_field.id + "]")
            }
            if (this.form_field_label.length > 0) {
                return this.form_field_label.click(function(i) {
                    if (h.is_multiple) {
                        return h.container_mousedown(i)
                    } else {
                        return h.activate_field()
                    }
                })
            }
        };
        g.prototype.show_search_field_default = function() {
            if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
                this.search_field.val(this.default_text);
                return this.search_field.addClass("default")
            } else {
                this.search_field.val("");
                return this.search_field.removeClass("default")
            }
        };
        g.prototype.search_results_mouseup = function(h) {
            var i;
            i = d(h.target).hasClass("active-result") ? d(h.target) : d(h.target).parents(".active-result").first();
            if (i.length) {
                this.result_highlight = i;
                this.result_select(h);
                return this.search_field.focus()
            }
        };
        g.prototype.search_results_mouseover = function(h) {
            var i;
            i = d(h.target).hasClass("active-result") ? d(h.target) : d(h.target).parents(".active-result").first();
            if (i) {
                return this.result_do_highlight(i)
            }
        };
        g.prototype.search_results_mouseout = function(h) {
            if (d(h.target).hasClass("active-result" || d(h.target).parents(".active-result").first())) {
                return this.result_clear_highlight()
            }
        };
        g.prototype.choice_build = function(i) {
            var h, j, k = this;
            h = d("<li />", {
                "class": "search-choice"
            }).html("<span>" + i.html + "</span>");
            if (i.disabled) {
                h.addClass("search-choice-disabled")
            } else {
                j = d("<a />", {
                    href: "#",
                    "class": "search-choice-close",
                    rel: i.array_index
                });
                j.click(function(l) {
                    return k.choice_destroy_link_click(l)
                });
                h.append(j)
            }
            return this.search_container.before(h)
        };
        g.prototype.choice_destroy_link_click = function(h) {
            h.preventDefault();
            h.stopPropagation();
            if (!this.is_disabled) {
                return this.choice_destroy(d(h.target))
            }
        };
        g.prototype.choice_destroy = function(h) {
            if (this.result_deselect(h.attr("rel"))) {
                if (!this.options.multiple_always_open) {
                    this.show_search_field_default();
                    if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
                        this.results_hide()
                    }
                }
                h.parents("li").first().remove();
                if (this.options.multiple_always_open) {
                    this.search_field.focus()
                }
                return this.search_field_scale()
            }
        };
        g.prototype.results_reset = function() {
            this.form_field.options[0].selected = true;
            this.selected_option_count = null;
            this.selected_item.find("span").text(this.default_text);
            if (!this.is_multiple) {
                this.selected_item.addClass("chzn-default")
            }
            this.show_search_field_default();
            this.results_reset_cleanup();
            this.form_field_jq.trigger("change");
            if (this.active_field) {
                return this.results_hide()
            }
        };
        g.prototype.results_reset_cleanup = function() {
            this.current_selectedIndex = this.form_field.selectedIndex;
            return this.selected_item.find("abbr").remove()
        };
        g.prototype.result_select = function(i) {
            var l, k, j, h;
            if (this.result_highlight) {
                l = this.result_highlight;
                k = l.attr("id");
                this.result_clear_highlight();
                if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
                    this.form_field_jq.trigger("liszt:maxselected", {
                        chosen: this
                    });
                    return false
                }
                if (this.is_multiple) {
                    this.result_deactivate(l)
                } else {
                    this.search_results.find(".result-selected").removeClass("result-selected");
                    this.result_single_selected = l;
                    this.selected_item.removeClass("chzn-default")
                }
                l.addClass("result-selected");
                h = k.substr(k.lastIndexOf("_") + 1);
                j = this.results_data[h];
                if (this.form_field.options[j.options_index].disabled) {
                    return false
                }
                j.selected = true;
                this.form_field.options[j.options_index].selected = true;
                this.selected_option_count = null;
                if (this.is_multiple) {
                    this.choice_build(j)
                } else {
                    this.selected_item.find("span").first().text(j.text);
                    if (this.allow_single_deselect) {
                        this.single_deselect_control_build()
                    }
                }
                if (!((i.metaKey || i.ctrlKey) && this.is_multiple)) {
                    this.results_hide()
                }
                if (this.options.multiple_always_open) {
                    if (!this.options.multiple_select_maintains_winnow) {
                        this.search_field.val("")
                    }
                } else {
                    this.search_field.val("")
                }
                if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
                    this.form_field_jq.trigger("change", {
                        selected: this.form_field.options[j.options_index].value
                    })
                }
                this.current_selectedIndex = this.form_field.selectedIndex;
                if (this.options.multiple_always_open) {
                    this.results_search()
                }
                return this.search_field_scale()
            }
        };
        g.prototype.result_activate = function(h) {
            return h.addClass("active-result")
        };
        g.prototype.result_deactivate = function(h) {
            return h.removeClass("active-result")
        };
        g.prototype.result_deselect = function(j) {
            var h, i;
            i = this.results_data[j];
            if (!this.form_field.options[i.options_index].disabled) {
                i.selected = false;
                this.form_field.options[i.options_index].selected = false;
                this.selected_option_count = null;
                h = d("#" + this.container_id + "_o_" + j);
                h.removeClass("result-selected").addClass("active-result").show();
                this.result_clear_highlight();
                this.winnow_results();
                this.form_field_jq.trigger("change", {
                    deselected: this.form_field.options[i.options_index].value
                });
                this.search_field_scale();
                return true
            } else {
                return false
            }
        };
        g.prototype.single_deselect_control_build = function() {
            if (this.allow_single_deselect && this.selected_item.find("abbr").length < 1) {
                return this.selected_item.find("span").first().after('<abbr class="search-choice-close"></abbr>')
            }
        };
        g.prototype.winnow_results = function() {
            var n, p, t, s, j, q, m, w, r, v, u, o, k, i, h, x, y, l;
            this.no_results_clear();
            r = 0;
            v = this.search_field.val() === this.default_text ? "" : d("<div/>").text(d.trim(this.search_field.val())).html();
            q = this.search_contains ? "" : "^";
            if (this.optional_prefix) {
                q += this.optional_prefix + "?"
            }
            j = new RegExp(q + v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
            k = new RegExp(v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
            l = this.results_data;
            for (i = 0, x = l.length; i < x; i++) {
                p = l[i];
                if (!p.empty) {
                    if (p.group) {
                        d("#" + p.dom_id).css("display", "none")
                    } else {
                        if (!(this.is_multiple && p.selected)) {
                            n = false;
                            w = p.dom_id;
                            m = d("#" + w);
                            if (j.test(p.html)) {
                                n = true;
                                r += 1
                            } else {
                                if (this.enable_split_word_search && (p.html.indexOf(" ") >= 0 || p.html.indexOf("[") === 0)) {
                                    s = p.html.replace(/\[|\]/g, "").split(" ");
                                    if (s.length) {
                                        for (h = 0, y = s.length; h < y; h++) {
                                            t = s[h];
                                            if (j.test(t)) {
                                                n = true;
                                                r += 1
                                            }
                                        }
                                    }
                                }
                            }
                            if (n) {
                                if (v.length) {
                                    u = p.html.search(k);
                                    o = p.html.substr(0, u + v.length) + "</em>" + p.html.substr(u + v.length);
                                    o = o.substr(0, u) + "<em>" + o.substr(u)
                                } else {
                                    o = p.html
                                }
                                m.html(o);
                                this.result_activate(m);
                                if (p.group_array_index != null) {
                                    d("#" + this.results_data[p.group_array_index].dom_id).css("display", "list-item")
                                }
                            } else {
                                if (this.result_highlight && w === this.result_highlight.attr("id")) {
                                    this.result_clear_highlight()
                                }
                                this.result_deactivate(m)
                            }
                        }
                    }
                }
            }
            if (r < 1 && v.length) {
                return this.no_results(v)
            } else {
                return this.winnow_results_set_highlight()
            }
        };
        g.prototype.winnow_results_clear = function() {
            var h, k, l, j, i;
            this.search_field.val("");
            k = this.search_results.find("li");
            i = [];
            for (l = 0, j = k.length; l < j; l++) {
                h = k[l];
                h = d(h);
                if (h.hasClass("group-result")) {
                    i.push(h.css("display", "auto"))
                } else {
                    if (!this.is_multiple || !h.hasClass("result-selected")) {
                        i.push(this.result_activate(h))
                    } else {
                        i.push(void 0)
                    }
                }
            }
            return i
        };
        g.prototype.winnow_results_set_highlight = function() {
            var h, i;
            if (!this.result_highlight) {
                i = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
                h = i.length ? i.first() : this.search_results.find(".active-result").first();
                if (h != null) {
                    return this.result_do_highlight(h)
                }
            }
        };
        g.prototype.no_results = function(h) {
            var i;
            i = d('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
            i.find("span").first().html(h);
            return this.search_results.append(i)
        };
        g.prototype.no_results_clear = function() {
            return this.search_results.find(".no-results").remove()
        };
        g.prototype.keydown_arrow = function() {
            var i, h;
            if (!this.result_highlight) {
                i = this.search_results.find("li.active-result").first();
                if (i) {
                    this.result_do_highlight(d(i))
                }
            } else {
                if (this.results_showing) {
                    h = this.result_highlight.nextAll("li.active-result").first();
                    if (h) {
                        this.result_do_highlight(h)
                    }
                }
            }
            if (!this.results_showing) {
                return this.results_show()
            }
        };
        g.prototype.keyup_arrow = function() {
            var h;
            if (!this.results_showing && !this.is_multiple) {
                return this.results_show()
            } else {
                if (this.result_highlight) {
                    h = this.result_highlight.prevAll("li.active-result");
                    if (h.length) {
                        return this.result_do_highlight(h.first())
                    } else {
                        if (this.choices_count() > 0) {
                            this.results_hide()
                        }
                        return this.result_clear_highlight()
                    }
                }
            }
        };
        g.prototype.keydown_backstroke = function() {
            var h;
            if (this.pending_backstroke) {
                this.choice_destroy(this.pending_backstroke.find("a").first());
                return this.clear_backstroke()
            } else {
                h = this.search_container.siblings("li.search-choice").last();
                if (h.length && !h.hasClass("search-choice-disabled")) {
                    this.pending_backstroke = h;
                    if (this.single_backstroke_delete) {
                        return this.keydown_backstroke()
                    } else {
                        return this.pending_backstroke.addClass("search-choice-focus")
                    }
                }
            }
        };
        g.prototype.clear_backstroke = function() {
            if (this.pending_backstroke) {
                this.pending_backstroke.removeClass("search-choice-focus")
            }
            return this.pending_backstroke = null
        };
        g.prototype.keydown_checker = function(h) {
            var j, i;
            j = (i = h.which) != null ? i : h.keyCode;
            this.search_field_scale();
            if (j !== 8 && this.pending_backstroke) {
                this.clear_backstroke()
            }
            switch (j) {
                case 8:
                    this.backstroke_length = this.search_field.val().length;
                    break;
                case 9:
                    if (this.results_showing && !this.is_multiple) {
                        this.result_select(h)
                    }
                    this.mouse_on_container = false;
                    break;
                case 13:
                    h.preventDefault();
                    break;
                case 38:
                    h.preventDefault();
                    this.keyup_arrow();
                    break;
                case 40:
                    this.keydown_arrow();
                    break
            }
        };
        g.prototype.search_field_scale = function() {
            var p, l, k, n, m, j, o, i;
            if (this.is_multiple) {
                l = 0;
                j = 0;
                n = "position:absolute; left: -1000px; top: -1000px; display:none;";
                m = ["font-size", "font-style", "font-weight", "font-family", "line-height", "text-transform", "letter-spacing"];
                for (o = 0, i = m.length; o < i; o++) {
                    k = m[o];
                    n += k + ":" + this.search_field.css(k) + ";"
                }
                p = d("<div />", {
                    style: n
                });
                p.text(this.search_field.val());
                d("body").append(p);
                j = p.width() + 25;
                p.remove();
                if (!this.f_width) {
                    this.f_width = this.container.outerWidth()
                }
                if (j > this.f_width - 10) {
                    j = this.f_width - 10
                }
                return this.search_field.css({
                    width: j + "px"
                })
            }
        };
        g.prototype.generate_random_id = function() {
            var h;
            h = "sel" + this.generate_random_char() + this.generate_random_char() + this.generate_random_char();
            while (d("#" + h).length > 0) {
                h += this.generate_random_char()
            }
            return h
        };
        return g
    })(AbstractChosen);
    a.Chosen = e
}).call(this);
(function(d, b, a, f) {
    var e = d(b);
    var c = {};
    d.fn.lazyload = function(h) {
        var k = this;
        var l;
        var j = {
            threshold: 0,
            failure_limit: 0,
            event: "scroll",
            effect: "show",
            container: b,
            data_attribute: "original",
            skip_invisible: (h && h.skip_invisible !== f ? h.skip_invisible : true),
            appear: null,
            load: null,
            placeholder: null
        };
        h = h || {};
        h.throttle = (h.throttle || 125);

        function i() {
            if (!h.throttle) {
                return m()
            } else {
                TS.utility.throttle.method(m, "jquery_lazyload", h.throttle)
            }
        }

        function m() {
            var n = 0;
            if ((!k || !k.each || !k.length) && g) {
                g();
                return false
            }
            if (j.skip_invisible && l[0] && l[0] !== b && !l.is(":visible")) {
                return
            }
            k.each(function() {
                var o = d(this);
                if (j.skip_invisible && !o.is(":visible")) {
                    o = null;
                    return
                }
                if (d.abovethetop(this, j) || d.leftofbegin(this, j)) {} else {
                    if (!d.belowthefold(this, j) && !d.rightoffold(this, j)) {
                        o.trigger("appear");
                        n = 0
                    } else {
                        if (++n > j.failure_limit) {
                            o = null;
                            return false
                        }
                    }
                }
                o = null
            })
        }

        function g() {
            if (l && k) {
                l.unbind(j.event + ".lazyload");
                e.unbind("resize", i);
                e.unbind("resize-immediate", m);
                k.each(function() {
                    d(this).unbind()
                });
                l = null;
                k = null
            }
        }
        if (h) {
            if (f !== h.failurelimit) {
                h.failure_limit = h.failurelimit;
                delete h.failurelimit
            }
            if (f !== h.effectspeed) {
                h.effect_speed = h.effectspeed;
                delete h.effectspeed
            }
            d.extend(j, h)
        }
        l = (j.container === f || j.container === b) ? e : d(j.container);
        if (0 === j.event.indexOf("scroll")) {
            l.bind(j.event + ".lazyload", i)
        }
        this.each(function() {
            var n = this;
            var p = d(n);
            var o = p.attr("src");
            var q = p.attr("data-" + j.data_attribute);
            n.loaded = false;
            p.one("appear", function() {
                if (!this.loaded) {
                    if (j.appear) {
                        if (k) {
                            var r = k.length;
                            j.appear.call(n, r, j)
                        }
                    }
                    d("<img />").one("load", function() {
                        var s;
                        p.hide();
                        if (p.is("img")) {
                            p.attr("src", q)
                        } else {
                            p.css("background-image", "url('" + q + "')")
                        }
                        p[j.effect](j.effect_speed);
                        n.loaded = true;
                        if (k) {
                            s = d.grep(k, function(u) {
                                return !u.loaded
                            });
                            k = d(s)
                        }
                        c[q] = true;
                        if (j.load && k) {
                            var t = k.length;
                            j.load.call(n, t, j)
                        }
                    }).attr("src", q)
                }
            });
            if (o === f || o === false) {
                if (p.is("img")) {
                    if (c[q]) {
                        p.trigger("appear")
                    } else {
                        if (j.placeholder) {
                            p.attr("src", j.placeholder)
                        }
                    }
                }
            } else {
                if (c[q]) {
                    p.trigger("appear")
                }
            }
            if (0 !== j.event.indexOf("scroll")) {
                p.bind(j.event, function() {
                    if (!n.loaded) {
                        p.trigger("appear")
                    }
                })
            }
        });
        e.bind("resize", i);
        e.bind("resize-immediate", m);
        if ((/(?:iphone|ipod|ipad).*os 5/gi).test(navigator.appVersion)) {
            e.bind("pageshow", function(n) {
                if (n.originalEvent && n.originalEvent.persisted) {
                    k.each(function() {
                        d(this).trigger("appear")
                    })
                }
            })
        }
        d(a).ready(m);
        this.detachEvents = g;
        return this
    };
    d.belowthefold = function(h, i) {
        var g;
        if (i.container === f || i.container === b) {
            g = (b.innerHeight ? b.innerHeight : e.height()) + e.scrollTop()
        } else {
            g = d(i.container).offset().top + d(i.container).height()
        }
        return g <= d(h).offset().top - i.threshold
    };
    d.rightoffold = function(h, i) {
        var g;
        if (i.container === f || i.container === b) {
            g = e.width() + e.scrollLeft()
        } else {
            g = d(i.container).offset().left + d(i.container).width()
        }
        return g <= d(h).offset().left - i.threshold
    };
    d.abovethetop = function(h, i) {
        var g;
        if (i.container === f || i.container === b) {
            g = e.scrollTop()
        } else {
            g = d(i.container).offset().top
        }
        return g >= d(h).offset().top + i.threshold + d(h).height()
    };
    d.leftofbegin = function(h, i) {
        var g;
        if (i.container === f || i.container === b) {
            g = e.scrollLeft()
        } else {
            g = d(i.container).offset().left
        }
        return g >= d(h).offset().left + i.threshold + d(h).width()
    };
    d.inviewport = function(g, h) {
        return !d.rightoffold(g, h) && !d.leftofbegin(g, h) && !d.belowthefold(g, h) && !d.abovethetop(g, h)
    };
    d.extend(d.expr[":"], {
        "below-the-fold": function(g) {
            return d.belowthefold(g, {
                threshold: 0
            })
        },
        "above-the-top": function(g) {
            return !d.belowthefold(g, {
                threshold: 0
            })
        },
        "right-of-screen": function(g) {
            return d.rightoffold(g, {
                threshold: 0
            })
        },
        "left-of-screen": function(g) {
            return !d.rightoffold(g, {
                threshold: 0
            })
        },
        "in-viewport": function(g) {
            return d.inviewport(g, {
                threshold: 0
            })
        },
        "above-the-fold": function(g) {
            return !d.belowthefold(g, {
                threshold: 0
            })
        },
        "right-of-fold": function(g) {
            return d.rightoffold(g, {
                threshold: 0
            })
        },
        "left-of-fold": function(g) {
            return !d.rightoffold(g, {
                threshold: 0
            })
        }
    })
})(jQuery, window, document);
/*!

 handlebars v2.0.0-alpha.2

Copyright (C) 2011-2014 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/
;
this.Handlebars = (function() {
    var a = (function() {
        var m;

        function n(o) {
            this.string = o
        }
        n.prototype.toString = function() {
            return "" + this.string
        };
        m = n;
        return m
    })();
    var k = (function(w) {
        var x = {};
        var q = w;
        var y = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        };
        var m = /[&<>"'`]/g;
        var r = /[&<>"'`]/;

        function z(A) {
            return y[A] || "&amp;"
        }

        function v(C) {
            for (var B = 1; B < arguments.length; B++) {
                for (var A in arguments[B]) {
                    if (Object.prototype.hasOwnProperty.call(arguments[B], A)) {
                        C[A] = arguments[B][A]
                    }
                }
            }
            return C
        }
        x.extend = v;
        var o = Object.prototype.toString;
        x.toString = o;
        var n = function(A) {
            return typeof A === "function"
        };
        if (n(/x/)) {
            n = function(A) {
                return typeof A === "function" && o.call(A) === "[object Function]"
            }
        }
        var n;
        x.isFunction = n;
        var u = Array.isArray || function(A) {
            return (A && typeof A === "object") ? o.call(A) === "[object Array]" : false
        };
        x.isArray = u;

        function t(A) {
            if (A instanceof q) {
                return A.toString()
            } else {
                if (!A && A !== 0) {
                    return ""
                }
            }
            A = "" + A;
            if (!r.test(A)) {
                return A
            }
            return A.replace(m, z)
        }
        x.escapeExpression = t;

        function s(A) {
            if (!A && A !== 0) {
                return true
            } else {
                if (u(A) && A.length === 0) {
                    return true
                } else {
                    return false
                }
            }
        }
        x.isEmpty = s;

        function p(A, B) {
            return (A ? A + "." : "") + B
        }
        x.appendContextPath = p;
        return x
    })(a);
    var d = (function() {
        var n;
        var o = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];

        function m(t, s) {
            var q;
            if (s && s.firstLine) {
                q = s.firstLine;
                t += " - " + q + ":" + s.firstColumn
            }
            var r = Error.prototype.constructor.call(this, t);
            for (var p = 0; p < o.length; p++) {
                this[o[p]] = r[o[p]]
            }
            if (q) {
                this.lineNumber = q;
                this.column = s.firstColumn
            }
        }
        m.prototype = new Error();
        n = m;
        return n
    })();
    var i = (function(x, A) {
        var z = {};
        var v = x;
        var t = A;
        var C = "2.0.0-alpha.2";
        z.VERSION = C;
        var n = 5;
        z.COMPILER_REVISION = n;
        var q = {
            1: "<= 1.0.rc.2",
            2: "== 1.0.0-rc.3",
            3: "== 1.0.0-rc.4",
            4: "== 1.x.x",
            5: ">= 2.0.0"
        };
        z.REVISION_CHANGES = q;
        var u = v.isArray,
            p = v.isFunction,
            o = v.toString,
            m = "[object Object]";

        function s(E, D) {
            this.helpers = E || {};
            this.partials = D || {};
            w(this)
        }
        z.HandlebarsEnvironment = s;
        s.prototype = {
            constructor: s,
            logger: y,
            log: r,
            registerHelper: function(E, F, D) {
                if (o.call(E) === m) {
                    if (D || F) {
                        throw new t("Arg not supported with multiple helpers")
                    }
                    v.extend(this.helpers, E)
                } else {
                    if (D) {
                        F.not = D
                    }
                    this.helpers[E] = F
                }
            },
            unregisterHelper: function(D) {
                delete this.helpers[D]
            },
            registerPartial: function(D, E) {
                if (o.call(D) === m) {
                    v.extend(this.partials, D)
                } else {
                    this.partials[D] = E
                }
            },
            unregisterPartial: function(D) {
                delete this.partials[D]
            }
        };

        function w(D) {
            D.registerHelper("helperMissing", function() {
                if (arguments.length === 1) {
                    return undefined
                } else {
                    throw new t("Missing helper: '" + arguments[arguments.length - 1].name + "'")
                }
            });
            D.registerHelper("blockHelperMissing", function(G, F) {
                var E = F.inverse || function() {},
                    H = F.fn;
                if (p(G)) {
                    G = G.call(this)
                }
                if (G === true) {
                    return H(this)
                } else {
                    if (G === false || G == null) {
                        return E(this)
                    } else {
                        if (u(G)) {
                            if (G.length > 0) {
                                if (F.ids) {
                                    F.ids = [F.name]
                                }
                                return D.helpers.each(G, F)
                            } else {
                                return E(this)
                            }
                        } else {
                            if (F.data && F.ids) {
                                var I = B(F.data);
                                I.contextPath = v.appendContextPath(F.data.contextPath, F.name);
                                F = {
                                    data: I
                                }
                            }
                            return H(G, F)
                        }
                    }
                }
            });
            D.registerHelper("each", function(E, N) {
                if (!N) {
                    N = E;
                    E = this
                }
                var L = N.fn,
                    H = N.inverse;
                var J = 0,
                    K = "",
                    I;
                var F;
                if (N.data && N.ids) {
                    F = v.appendContextPath(N.data.contextPath, N.ids[0]) + "."
                }
                if (p(E)) {
                    E = E.call(this)
                }
                if (N.data) {
                    I = B(N.data)
                }
                if (E && typeof E === "object") {
                    if (u(E)) {
                        for (var G = E.length; J < G; J++) {
                            if (I) {
                                I.index = J;
                                I.first = (J === 0);
                                I.last = (J === (E.length - 1));
                                if (F) {
                                    I.contextPath = F + J
                                }
                            }
                            K = K + L(E[J], {
                                data: I
                            })
                        }
                    } else {
                        for (var M in E) {
                            if (E.hasOwnProperty(M)) {
                                if (I) {
                                    I.key = M;
                                    I.index = J;
                                    I.first = (J === 0);
                                    if (F) {
                                        I.contextPath = F + M
                                    }
                                }
                                K = K + L(E[M], {
                                    data: I
                                });
                                J++
                            }
                        }
                    }
                }
                if (J === 0) {
                    K = H(this)
                }
                return K
            });
            D.registerHelper("if", function(F, E) {
                if (p(F)) {
                    F = F.call(this)
                }
                if ((!E.hash.includeZero && !F) || v.isEmpty(F)) {
                    return E.inverse(this)
                } else {
                    return E.fn(this)
                }
            });
            D.registerHelper("unless", function(F, E) {
                return D.helpers["if"].call(this, F, {
                    fn: E.inverse,
                    inverse: E.fn,
                    hash: E.hash
                })
            });
            D.registerHelper("with", function(F, E) {
                if (p(F)) {
                    F = F.call(this)
                }
                var G = E.fn;
                if (!v.isEmpty(F)) {
                    if (E.data && E.ids) {
                        var H = B(E.data);
                        H.contextPath = v.appendContextPath(E.data.contextPath, E.ids[0]);
                        E = {
                            data: H
                        }
                    }
                    return G(F, E)
                }
            });
            D.registerHelper("log", function(F, E) {
                var G = E.data && E.data.level != null ? parseInt(E.data.level, 10) : 1;
                D.log(G, F)
            });
            D.registerHelper("lookup", function(G, F, E) {
                return G && G[F]
            })
        }
        var y = {
            methodMap: {
                0: "debug",
                1: "info",
                2: "warn",
                3: "error"
            },
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            level: 3,
            log: function(F, D) {
                if (y.level <= F) {
                    var E = y.methodMap[F];
                    if (typeof console !== "undefined" && console[E]) {
                        console[E].call(console, D)
                    }
                }
            }
        };
        z.logger = y;

        function r(E, D) {
            y.log(E, D)
        }
        z.log = r;
        var B = function(D) {
            var E = v.extend({}, D);
            E._parent = D;
            return E
        };
        z.createFrame = B;
        return z
    })(k, d);
    var g = (function(v, A, p) {
        var y = {};
        var u = v;
        var s = A;
        var o = p.COMPILER_REVISION;
        var r = p.REVISION_CHANGES;
        var B = p.createFrame;

        function n(E) {
            var D = E && E[0] || 1,
                G = o;
            if (D !== G) {
                if (D < G) {
                    var C = r[G],
                        F = r[D];
                    throw new s("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + C + ") or downgrade your runtime to an older version (" + F + ").")
                } else {
                    throw new s("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + E[1] + ").")
                }
            }
        }
        y.checkRevision = n;

        function x(C, G) {
            if (!G) {
                throw new s("No environment passed to template")
            }
            G.VM.checkRevision(C.compiler);
            var F = function(N, H, J, K, I, M, L) {
                if (K) {
                    J = u.extend({}, J, K)
                }
                var P = G.VM.invokePartial.call(this, N, H, J, I, M, L);
                if (P != null) {
                    return P
                }
                if (G.compile) {
                    var O = {
                        helpers: I,
                        partials: M,
                        data: L
                    };
                    M[H] = G.compile(N, {
                        data: L !== undefined
                    }, G);
                    return M[H](J, O)
                } else {
                    throw new s("The partial " + H + " could not be compiled when running in runtime-only mode")
                }
            };
            var D = {
                escapeExpression: u.escapeExpression,
                invokePartial: F,
                fn: function(H) {
                    return C[H]
                },
                programs: [],
                program: function(I, K) {
                    var H = this.programs[I],
                        J = this.fn(I);
                    if (K) {
                        H = t(this, I, J, K)
                    } else {
                        if (!H) {
                            H = this.programs[I] = t(this, I, J)
                        }
                    }
                    return H
                },
                programWithDepth: G.VM.programWithDepth,
                data: function(H, I) {
                    while (H && I--) {
                        H = H._parent
                    }
                    return H
                },
                merge: function(J, I) {
                    var H = J || I;
                    if (J && I && (J !== I)) {
                        H = u.extend({}, I, J)
                    }
                    return H
                },
                noop: G.VM.noop,
                compilerInfo: C.compiler
            };
            var E = function(J, H) {
                H = H || {};
                var K, I, L = H.data;
                E._setup(H);
                if (!H.partial && C.useData) {
                    L = w(J, L)
                }
                return C.main.call(D, J, D.helpers, D.partials, L)
            };
            E._setup = function(H) {
                if (!H.partial) {
                    D.helpers = D.merge(H.helpers, G.helpers);
                    if (C.usePartial) {
                        D.partials = D.merge(H.partials, G.partials)
                    }
                } else {
                    D.helpers = H.helpers;
                    D.partials = H.partials
                }
            };
            E._child = function(H) {
                return D.programWithDepth(H)
            };
            return E
        }
        y.template = x;

        function q(E, G) {
            var D = Array.prototype.slice.call(arguments, 2),
                C = this,
                F = C.fn(E);
            var H = function(J, I) {
                I = I || {};
                return F.apply(C, [J, C.helpers, C.partials, I.data || G].concat(D))
            };
            H.program = E;
            H.depth = D.length;
            return H
        }
        y.programWithDepth = q;

        function t(C, D, E, F) {
            var G = function(I, H) {
                H = H || {};
                return E.call(C, I, C.helpers, C.partials, H.data || F)
            };
            G.program = D;
            G.depth = 0;
            return G
        }
        y.program = t;

        function m(C, E, G, H, F, I) {
            var D = {
                partial: true,
                helpers: H,
                partials: F,
                data: I
            };
            if (C === undefined) {
                throw new s("The partial " + E + " could not be found")
            } else {
                if (C instanceof Function) {
                    return C(G, D)
                }
            }
        }
        y.invokePartial = m;

        function z() {
            return ""
        }
        y.noop = z;

        function w(C, D) {
            if (!D || !("root" in D)) {
                D = D ? B(D) : {};
                D.root = C
            }
            return D
        }
        return y
    })(k, d, i);
    var f = (function(w, y, o, s, v) {
        var x;
        var m = w;
        var p = y;
        var r = o;
        var u = s;
        var q = v;
        var t = function() {
            var z = new m.HandlebarsEnvironment();
            u.extend(z, m);
            z.SafeString = p;
            z.Exception = r;
            z.Utils = u;
            z.VM = q;
            z.template = function(A) {
                return q.template(A, z)
            };
            return z
        };
        var n = t();
        n.create = t;
        x = n;
        return x
    })(i, a, d, k, g);
    var j = (function(q) {
        var o;
        var n = q;

        function m(r) {
            r = r || {};
            this.firstLine = r.first_line;
            this.firstColumn = r.first_column;
            this.lastColumn = r.last_column;
            this.lastLine = r.last_line
        }
        var p = {
            ProgramNode: function(t, v, s, u) {
                var r, w;
                if (arguments.length === 3) {
                    u = s;
                    s = null
                } else {
                    if (arguments.length === 2) {
                        u = v;
                        v = null
                    }
                }
                m.call(this, u);
                this.type = "program";
                this.statements = t;
                this.strip = {};
                if (s) {
                    w = s[0];
                    if (w) {
                        r = {
                            first_line: w.firstLine,
                            last_line: w.lastLine,
                            last_column: w.lastColumn,
                            first_column: w.firstColumn
                        };
                        this.inverse = new p.ProgramNode(s, v, r)
                    } else {
                        this.inverse = new p.ProgramNode(s, v)
                    }
                    this.strip.right = v.left
                } else {
                    if (v) {
                        this.strip.left = v.right
                    }
                }
            },
            MustacheNode: function(w, v, r, t, s) {
                m.call(this, s);
                this.type = "mustache";
                this.strip = t;
                if (r != null && r.charAt) {
                    var u = r.charAt(3) || r.charAt(2);
                    this.escaped = u !== "{" && u !== "&"
                } else {
                    this.escaped = !!r
                }
                if (w instanceof p.SexprNode) {
                    this.sexpr = w
                } else {
                    this.sexpr = new p.SexprNode(w, v)
                }
                this.sexpr.isRoot = true;
                this.id = this.sexpr.id;
                this.params = this.sexpr.params;
                this.hash = this.sexpr.hash;
                this.eligibleHelper = this.sexpr.eligibleHelper;
                this.isHelper = this.sexpr.isHelper
            },
            SexprNode: function(v, s, r) {
                m.call(this, r);
                this.type = "sexpr";
                this.hash = s;
                var u = this.id = v[0];
                var t = this.params = v.slice(1);
                this.isHelper = t.length || s;
                this.eligibleHelper = this.isHelper || u.isSimple
            },
            PartialNode: function(r, t, v, u, s) {
                m.call(this, s);
                this.type = "partial";
                this.partialName = r;
                this.context = t;
                this.hash = v;
                this.strip = u
            },
            BlockNode: function(u, s, r, v, t) {
                m.call(this, t);
                if (u.sexpr.id.original !== v.path.original) {
                    throw new n(u.sexpr.id.original + " doesn't match " + v.path.original, this)
                }
                this.type = "block";
                this.mustache = u;
                this.program = s;
                this.inverse = r;
                this.strip = {
                    left: u.strip.left,
                    right: v.strip.right
                };
                (s || r).strip.left = u.strip.right;
                (r || s).strip.right = v.strip.left;
                if (r && !s) {
                    this.isInverse = true
                }
            },
            RawBlockNode: function(t, s, u, r) {
                m.call(this, r);
                if (t.sexpr.id.original !== u) {
                    throw new n(t.sexpr.id.original + " doesn't match " + u, this)
                }
                s = new p.ContentNode(s, r);
                this.type = "block";
                this.mustache = t;
                this.program = new p.ProgramNode([s], r)
            },
            ContentNode: function(r, s) {
                m.call(this, s);
                this.type = "content";
                this.string = r
            },
            HashNode: function(s, r) {
                m.call(this, r);
                this.type = "hash";
                this.pairs = s
            },
            IdNode: function(v, y) {
                m.call(this, y);
                this.type = "ID";
                var t = "",
                    z = [],
                    w = 0,
                    s = "";
                for (var x = 0, u = v.length; x < u; x++) {
                    var r = v[x].part;
                    t += (v[x].separator || "") + r;
                    if (r === ".." || r === "." || r === "this") {
                        if (z.length > 0) {
                            throw new n("Invalid path: " + t, this)
                        } else {
                            if (r === "..") {
                                w++;
                                s += "../"
                            } else {
                                this.isScoped = true
                            }
                        }
                    } else {
                        z.push(r)
                    }
                }
                this.original = t;
                this.parts = z;
                this.string = z.join(".");
                this.depth = w;
                this.idName = s + this.string;
                this.isSimple = v.length === 1 && !this.isScoped && w === 0;
                this.stringModeValue = this.string
            },
            PartialNameNode: function(r, s) {
                m.call(this, s);
                this.type = "PARTIAL_NAME";
                this.name = r.original
            },
            DataNode: function(s, r) {
                m.call(this, r);
                this.type = "DATA";
                this.id = s;
                this.stringModeValue = s.stringModeValue;
                this.idName = "@" + s.stringModeValue
            },
            StringNode: function(r, s) {
                m.call(this, s);
                this.type = "STRING";
                this.original = this.string = this.stringModeValue = r
            },
            NumberNode: function(s, r) {
                m.call(this, r);
                this.type = "NUMBER";
                this.original = this.number = s;
                this.stringModeValue = Number(s)
            },
            BooleanNode: function(r, s) {
                m.call(this, s);
                this.type = "BOOLEAN";
                this.bool = r;
                this.stringModeValue = r === "true"
            },
            CommentNode: function(s, r) {
                m.call(this, r);
                this.type = "comment";
                this.comment = s
            }
        };
        o = p;
        return o
    })(d);
    var b = (function() {
        var n;
        var m = (function() {
            var v = {
                trace: function r() {},
                yy: {},
                symbols_: {
                    error: 2,
                    root: 3,
                    statements: 4,
                    EOF: 5,
                    program: 6,
                    simpleInverse: 7,
                    statement: 8,
                    openRawBlock: 9,
                    CONTENT: 10,
                    END_RAW_BLOCK: 11,
                    openInverse: 12,
                    closeBlock: 13,
                    openBlock: 14,
                    mustache: 15,
                    partial: 16,
                    COMMENT: 17,
                    OPEN_RAW_BLOCK: 18,
                    sexpr: 19,
                    CLOSE_RAW_BLOCK: 20,
                    OPEN_BLOCK: 21,
                    CLOSE: 22,
                    OPEN_INVERSE: 23,
                    OPEN_ENDBLOCK: 24,
                    path: 25,
                    OPEN: 26,
                    OPEN_UNESCAPED: 27,
                    CLOSE_UNESCAPED: 28,
                    OPEN_PARTIAL: 29,
                    partialName: 30,
                    param: 31,
                    partial_option0: 32,
                    partial_option1: 33,
                    sexpr_repetition0: 34,
                    sexpr_option0: 35,
                    dataName: 36,
                    STRING: 37,
                    NUMBER: 38,
                    BOOLEAN: 39,
                    OPEN_SEXPR: 40,
                    CLOSE_SEXPR: 41,
                    hash: 42,
                    hash_repetition_plus0: 43,
                    hashSegment: 44,
                    ID: 45,
                    EQUALS: 46,
                    DATA: 47,
                    pathSegments: 48,
                    SEP: 49,
                    "$accept": 0,
                    "$end": 1
                },
                terminals_: {
                    2: "error",
                    5: "EOF",
                    10: "CONTENT",
                    11: "END_RAW_BLOCK",
                    17: "COMMENT",
                    18: "OPEN_RAW_BLOCK",
                    20: "CLOSE_RAW_BLOCK",
                    21: "OPEN_BLOCK",
                    22: "CLOSE",
                    23: "OPEN_INVERSE",
                    24: "OPEN_ENDBLOCK",
                    26: "OPEN",
                    27: "OPEN_UNESCAPED",
                    28: "CLOSE_UNESCAPED",
                    29: "OPEN_PARTIAL",
                    37: "STRING",
                    38: "NUMBER",
                    39: "BOOLEAN",
                    40: "OPEN_SEXPR",
                    41: "CLOSE_SEXPR",
                    45: "ID",
                    46: "EQUALS",
                    47: "DATA",
                    49: "SEP"
                },
                productions_: [0, [3, 2],
                    [3, 1],
                    [6, 2],
                    [6, 3],
                    [6, 2],
                    [6, 1],
                    [6, 1],
                    [6, 0],
                    [4, 1],
                    [4, 2],
                    [8, 3],
                    [8, 3],
                    [8, 3],
                    [8, 1],
                    [8, 1],
                    [8, 1],
                    [8, 1],
                    [9, 3],
                    [14, 3],
                    [12, 3],
                    [13, 3],
                    [15, 3],
                    [15, 3],
                    [16, 5],
                    [16, 4],
                    [7, 2],
                    [19, 3],
                    [19, 1],
                    [31, 1],
                    [31, 1],
                    [31, 1],
                    [31, 1],
                    [31, 1],
                    [31, 3],
                    [42, 1],
                    [44, 3],
                    [30, 1],
                    [30, 1],
                    [30, 1],
                    [36, 2],
                    [25, 1],
                    [48, 3],
                    [48, 1],
                    [32, 0],
                    [32, 1],
                    [33, 0],
                    [33, 1],
                    [34, 0],
                    [34, 2],
                    [35, 0],
                    [35, 1],
                    [43, 1],
                    [43, 2]
                ],
                performAction: function q(w, z, A, D, C, y, B) {
                    var x = y.length - 1;
                    switch (C) {
                        case 1:
                            return new D.ProgramNode(y[x - 1], this._$);
                            break;
                        case 2:
                            return new D.ProgramNode([], this._$);
                            break;
                        case 3:
                            this.$ = new D.ProgramNode([], y[x - 1], y[x], this._$);
                            break;
                        case 4:
                            this.$ = new D.ProgramNode(y[x - 2], y[x - 1], y[x], this._$);
                            break;
                        case 5:
                            this.$ = new D.ProgramNode(y[x - 1], y[x], [], this._$);
                            break;
                        case 6:
                            this.$ = new D.ProgramNode(y[x], this._$);
                            break;
                        case 7:
                            this.$ = new D.ProgramNode([], this._$);
                            break;
                        case 8:
                            this.$ = new D.ProgramNode([], this._$);
                            break;
                        case 9:
                            this.$ = [y[x]];
                            break;
                        case 10:
                            y[x - 1].push(y[x]);
                            this.$ = y[x - 1];
                            break;
                        case 11:
                            this.$ = new D.RawBlockNode(y[x - 2], y[x - 1], y[x], this._$);
                            break;
                        case 12:
                            this.$ = new D.BlockNode(y[x - 2], y[x - 1].inverse, y[x - 1], y[x], this._$);
                            break;
                        case 13:
                            this.$ = new D.BlockNode(y[x - 2], y[x - 1], y[x - 1].inverse, y[x], this._$);
                            break;
                        case 14:
                            this.$ = y[x];
                            break;
                        case 15:
                            this.$ = y[x];
                            break;
                        case 16:
                            this.$ = new D.ContentNode(y[x], this._$);
                            break;
                        case 17:
                            this.$ = new D.CommentNode(y[x], this._$);
                            break;
                        case 18:
                            this.$ = new D.MustacheNode(y[x - 1], null, "", "", this._$);
                            break;
                        case 19:
                            this.$ = new D.MustacheNode(y[x - 1], null, y[x - 2], o(y[x - 2], y[x]), this._$);
                            break;
                        case 20:
                            this.$ = new D.MustacheNode(y[x - 1], null, y[x - 2], o(y[x - 2], y[x]), this._$);
                            break;
                        case 21:
                            this.$ = {
                                path: y[x - 1],
                                strip: o(y[x - 2], y[x])
                            };
                            break;
                        case 22:
                            this.$ = new D.MustacheNode(y[x - 1], null, y[x - 2], o(y[x - 2], y[x]), this._$);
                            break;
                        case 23:
                            this.$ = new D.MustacheNode(y[x - 1], null, y[x - 2], o(y[x - 2], y[x]), this._$);
                            break;
                        case 24:
                            this.$ = new D.PartialNode(y[x - 3], y[x - 2], y[x - 1], o(y[x - 4], y[x]), this._$);
                            break;
                        case 25:
                            this.$ = new D.PartialNode(y[x - 2], undefined, y[x - 1], o(y[x - 3], y[x]), this._$);
                            break;
                        case 26:
                            this.$ = o(y[x - 1], y[x]);
                            break;
                        case 27:
                            this.$ = new D.SexprNode([y[x - 2]].concat(y[x - 1]), y[x], this._$);
                            break;
                        case 28:
                            this.$ = new D.SexprNode([y[x]], null, this._$);
                            break;
                        case 29:
                            this.$ = y[x];
                            break;
                        case 30:
                            this.$ = new D.StringNode(y[x], this._$);
                            break;
                        case 31:
                            this.$ = new D.NumberNode(y[x], this._$);
                            break;
                        case 32:
                            this.$ = new D.BooleanNode(y[x], this._$);
                            break;
                        case 33:
                            this.$ = y[x];
                            break;
                        case 34:
                            y[x - 1].isHelper = true;
                            this.$ = y[x - 1];
                            break;
                        case 35:
                            this.$ = new D.HashNode(y[x], this._$);
                            break;
                        case 36:
                            this.$ = [y[x - 2], y[x]];
                            break;
                        case 37:
                            this.$ = new D.PartialNameNode(y[x], this._$);
                            break;
                        case 38:
                            this.$ = new D.PartialNameNode(new D.StringNode(y[x], this._$), this._$);
                            break;
                        case 39:
                            this.$ = new D.PartialNameNode(new D.NumberNode(y[x], this._$));
                            break;
                        case 40:
                            this.$ = new D.DataNode(y[x], this._$);
                            break;
                        case 41:
                            this.$ = new D.IdNode(y[x], this._$);
                            break;
                        case 42:
                            y[x - 2].push({
                                part: y[x],
                                separator: y[x - 1]
                            });
                            this.$ = y[x - 2];
                            break;
                        case 43:
                            this.$ = [{
                                part: y[x]
                            }];
                            break;
                        case 48:
                            this.$ = [];
                            break;
                        case 49:
                            y[x - 1].push(y[x]);
                            break;
                        case 52:
                            this.$ = [y[x]];
                            break;
                        case 53:
                            y[x - 1].push(y[x]);
                            break
                    }
                },
                table: [{
                    3: 1,
                    4: 2,
                    5: [1, 3],
                    8: 4,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    1: [3]
                }, {
                    5: [1, 18],
                    8: 19,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    1: [2, 2]
                }, {
                    5: [2, 9],
                    10: [2, 9],
                    17: [2, 9],
                    18: [2, 9],
                    21: [2, 9],
                    23: [2, 9],
                    24: [2, 9],
                    26: [2, 9],
                    27: [2, 9],
                    29: [2, 9]
                }, {
                    10: [1, 20]
                }, {
                    4: 23,
                    6: 21,
                    7: 22,
                    8: 4,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 24],
                    24: [2, 8],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    4: 23,
                    6: 25,
                    7: 22,
                    8: 4,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 24],
                    24: [2, 8],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    5: [2, 14],
                    10: [2, 14],
                    17: [2, 14],
                    18: [2, 14],
                    21: [2, 14],
                    23: [2, 14],
                    24: [2, 14],
                    26: [2, 14],
                    27: [2, 14],
                    29: [2, 14]
                }, {
                    5: [2, 15],
                    10: [2, 15],
                    17: [2, 15],
                    18: [2, 15],
                    21: [2, 15],
                    23: [2, 15],
                    24: [2, 15],
                    26: [2, 15],
                    27: [2, 15],
                    29: [2, 15]
                }, {
                    5: [2, 16],
                    10: [2, 16],
                    17: [2, 16],
                    18: [2, 16],
                    21: [2, 16],
                    23: [2, 16],
                    24: [2, 16],
                    26: [2, 16],
                    27: [2, 16],
                    29: [2, 16]
                }, {
                    5: [2, 17],
                    10: [2, 17],
                    17: [2, 17],
                    18: [2, 17],
                    21: [2, 17],
                    23: [2, 17],
                    24: [2, 17],
                    26: [2, 17],
                    27: [2, 17],
                    29: [2, 17]
                }, {
                    19: 26,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    19: 32,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    19: 33,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    19: 34,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    19: 35,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    25: 37,
                    30: 36,
                    37: [1, 38],
                    38: [1, 39],
                    45: [1, 31],
                    48: 29
                }, {
                    1: [2, 1]
                }, {
                    5: [2, 10],
                    10: [2, 10],
                    17: [2, 10],
                    18: [2, 10],
                    21: [2, 10],
                    23: [2, 10],
                    24: [2, 10],
                    26: [2, 10],
                    27: [2, 10],
                    29: [2, 10]
                }, {
                    11: [1, 40]
                }, {
                    13: 41,
                    24: [1, 42]
                }, {
                    4: 43,
                    8: 4,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    24: [2, 7],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    7: 44,
                    8: 19,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 24],
                    24: [2, 6],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    19: 32,
                    22: [1, 45],
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    13: 46,
                    24: [1, 42]
                }, {
                    20: [1, 47]
                }, {
                    20: [2, 48],
                    22: [2, 48],
                    28: [2, 48],
                    34: 48,
                    37: [2, 48],
                    38: [2, 48],
                    39: [2, 48],
                    40: [2, 48],
                    41: [2, 48],
                    45: [2, 48],
                    47: [2, 48]
                }, {
                    20: [2, 28],
                    22: [2, 28],
                    28: [2, 28],
                    41: [2, 28]
                }, {
                    20: [2, 41],
                    22: [2, 41],
                    28: [2, 41],
                    37: [2, 41],
                    38: [2, 41],
                    39: [2, 41],
                    40: [2, 41],
                    41: [2, 41],
                    45: [2, 41],
                    47: [2, 41],
                    49: [1, 49]
                }, {
                    25: 50,
                    45: [1, 31],
                    48: 29
                }, {
                    20: [2, 43],
                    22: [2, 43],
                    28: [2, 43],
                    37: [2, 43],
                    38: [2, 43],
                    39: [2, 43],
                    40: [2, 43],
                    41: [2, 43],
                    45: [2, 43],
                    47: [2, 43],
                    49: [2, 43]
                }, {
                    22: [1, 51]
                }, {
                    22: [1, 52]
                }, {
                    22: [1, 53]
                }, {
                    28: [1, 54]
                }, {
                    22: [2, 46],
                    25: 57,
                    31: 55,
                    33: 56,
                    36: 61,
                    37: [1, 58],
                    38: [1, 59],
                    39: [1, 60],
                    40: [1, 62],
                    42: 63,
                    43: 64,
                    44: 66,
                    45: [1, 65],
                    47: [1, 30],
                    48: 29
                }, {
                    22: [2, 37],
                    37: [2, 37],
                    38: [2, 37],
                    39: [2, 37],
                    40: [2, 37],
                    45: [2, 37],
                    47: [2, 37]
                }, {
                    22: [2, 38],
                    37: [2, 38],
                    38: [2, 38],
                    39: [2, 38],
                    40: [2, 38],
                    45: [2, 38],
                    47: [2, 38]
                }, {
                    22: [2, 39],
                    37: [2, 39],
                    38: [2, 39],
                    39: [2, 39],
                    40: [2, 39],
                    45: [2, 39],
                    47: [2, 39]
                }, {
                    5: [2, 11],
                    10: [2, 11],
                    17: [2, 11],
                    18: [2, 11],
                    21: [2, 11],
                    23: [2, 11],
                    24: [2, 11],
                    26: [2, 11],
                    27: [2, 11],
                    29: [2, 11]
                }, {
                    5: [2, 12],
                    10: [2, 12],
                    17: [2, 12],
                    18: [2, 12],
                    21: [2, 12],
                    23: [2, 12],
                    24: [2, 12],
                    26: [2, 12],
                    27: [2, 12],
                    29: [2, 12]
                }, {
                    25: 67,
                    45: [1, 31],
                    48: 29
                }, {
                    8: 19,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    24: [2, 3],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    4: 68,
                    8: 4,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    24: [2, 5],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    10: [2, 26],
                    17: [2, 26],
                    18: [2, 26],
                    21: [2, 26],
                    23: [2, 26],
                    24: [2, 26],
                    26: [2, 26],
                    27: [2, 26],
                    29: [2, 26]
                }, {
                    5: [2, 13],
                    10: [2, 13],
                    17: [2, 13],
                    18: [2, 13],
                    21: [2, 13],
                    23: [2, 13],
                    24: [2, 13],
                    26: [2, 13],
                    27: [2, 13],
                    29: [2, 13]
                }, {
                    10: [2, 18]
                }, {
                    20: [2, 50],
                    22: [2, 50],
                    25: 57,
                    28: [2, 50],
                    31: 70,
                    35: 69,
                    36: 61,
                    37: [1, 58],
                    38: [1, 59],
                    39: [1, 60],
                    40: [1, 62],
                    41: [2, 50],
                    42: 71,
                    43: 64,
                    44: 66,
                    45: [1, 65],
                    47: [1, 30],
                    48: 29
                }, {
                    45: [1, 72]
                }, {
                    20: [2, 40],
                    22: [2, 40],
                    28: [2, 40],
                    37: [2, 40],
                    38: [2, 40],
                    39: [2, 40],
                    40: [2, 40],
                    41: [2, 40],
                    45: [2, 40],
                    47: [2, 40]
                }, {
                    10: [2, 20],
                    17: [2, 20],
                    18: [2, 20],
                    21: [2, 20],
                    23: [2, 20],
                    24: [2, 20],
                    26: [2, 20],
                    27: [2, 20],
                    29: [2, 20]
                }, {
                    10: [2, 19],
                    17: [2, 19],
                    18: [2, 19],
                    21: [2, 19],
                    23: [2, 19],
                    24: [2, 19],
                    26: [2, 19],
                    27: [2, 19],
                    29: [2, 19]
                }, {
                    5: [2, 22],
                    10: [2, 22],
                    17: [2, 22],
                    18: [2, 22],
                    21: [2, 22],
                    23: [2, 22],
                    24: [2, 22],
                    26: [2, 22],
                    27: [2, 22],
                    29: [2, 22]
                }, {
                    5: [2, 23],
                    10: [2, 23],
                    17: [2, 23],
                    18: [2, 23],
                    21: [2, 23],
                    23: [2, 23],
                    24: [2, 23],
                    26: [2, 23],
                    27: [2, 23],
                    29: [2, 23]
                }, {
                    22: [2, 44],
                    32: 73,
                    42: 74,
                    43: 64,
                    44: 66,
                    45: [1, 75]
                }, {
                    22: [1, 76]
                }, {
                    20: [2, 29],
                    22: [2, 29],
                    28: [2, 29],
                    37: [2, 29],
                    38: [2, 29],
                    39: [2, 29],
                    40: [2, 29],
                    41: [2, 29],
                    45: [2, 29],
                    47: [2, 29]
                }, {
                    20: [2, 30],
                    22: [2, 30],
                    28: [2, 30],
                    37: [2, 30],
                    38: [2, 30],
                    39: [2, 30],
                    40: [2, 30],
                    41: [2, 30],
                    45: [2, 30],
                    47: [2, 30]
                }, {
                    20: [2, 31],
                    22: [2, 31],
                    28: [2, 31],
                    37: [2, 31],
                    38: [2, 31],
                    39: [2, 31],
                    40: [2, 31],
                    41: [2, 31],
                    45: [2, 31],
                    47: [2, 31]
                }, {
                    20: [2, 32],
                    22: [2, 32],
                    28: [2, 32],
                    37: [2, 32],
                    38: [2, 32],
                    39: [2, 32],
                    40: [2, 32],
                    41: [2, 32],
                    45: [2, 32],
                    47: [2, 32]
                }, {
                    20: [2, 33],
                    22: [2, 33],
                    28: [2, 33],
                    37: [2, 33],
                    38: [2, 33],
                    39: [2, 33],
                    40: [2, 33],
                    41: [2, 33],
                    45: [2, 33],
                    47: [2, 33]
                }, {
                    19: 77,
                    25: 27,
                    36: 28,
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    22: [2, 47]
                }, {
                    20: [2, 35],
                    22: [2, 35],
                    28: [2, 35],
                    41: [2, 35],
                    44: 78,
                    45: [1, 75]
                }, {
                    20: [2, 43],
                    22: [2, 43],
                    28: [2, 43],
                    37: [2, 43],
                    38: [2, 43],
                    39: [2, 43],
                    40: [2, 43],
                    41: [2, 43],
                    45: [2, 43],
                    46: [1, 79],
                    47: [2, 43],
                    49: [2, 43]
                }, {
                    20: [2, 52],
                    22: [2, 52],
                    28: [2, 52],
                    41: [2, 52],
                    45: [2, 52]
                }, {
                    22: [1, 80]
                }, {
                    8: 19,
                    9: 5,
                    10: [1, 10],
                    12: 6,
                    14: 7,
                    15: 8,
                    16: 9,
                    17: [1, 11],
                    18: [1, 12],
                    21: [1, 14],
                    23: [1, 13],
                    24: [2, 4],
                    26: [1, 15],
                    27: [1, 16],
                    29: [1, 17]
                }, {
                    20: [2, 27],
                    22: [2, 27],
                    28: [2, 27],
                    41: [2, 27]
                }, {
                    20: [2, 49],
                    22: [2, 49],
                    28: [2, 49],
                    37: [2, 49],
                    38: [2, 49],
                    39: [2, 49],
                    40: [2, 49],
                    41: [2, 49],
                    45: [2, 49],
                    47: [2, 49]
                }, {
                    20: [2, 51],
                    22: [2, 51],
                    28: [2, 51],
                    41: [2, 51]
                }, {
                    20: [2, 42],
                    22: [2, 42],
                    28: [2, 42],
                    37: [2, 42],
                    38: [2, 42],
                    39: [2, 42],
                    40: [2, 42],
                    41: [2, 42],
                    45: [2, 42],
                    47: [2, 42],
                    49: [2, 42]
                }, {
                    22: [1, 81]
                }, {
                    22: [2, 45]
                }, {
                    46: [1, 79]
                }, {
                    5: [2, 25],
                    10: [2, 25],
                    17: [2, 25],
                    18: [2, 25],
                    21: [2, 25],
                    23: [2, 25],
                    24: [2, 25],
                    26: [2, 25],
                    27: [2, 25],
                    29: [2, 25]
                }, {
                    41: [1, 82]
                }, {
                    20: [2, 53],
                    22: [2, 53],
                    28: [2, 53],
                    41: [2, 53],
                    45: [2, 53]
                }, {
                    25: 57,
                    31: 83,
                    36: 61,
                    37: [1, 58],
                    38: [1, 59],
                    39: [1, 60],
                    40: [1, 62],
                    45: [1, 31],
                    47: [1, 30],
                    48: 29
                }, {
                    5: [2, 21],
                    10: [2, 21],
                    17: [2, 21],
                    18: [2, 21],
                    21: [2, 21],
                    23: [2, 21],
                    24: [2, 21],
                    26: [2, 21],
                    27: [2, 21],
                    29: [2, 21]
                }, {
                    5: [2, 24],
                    10: [2, 24],
                    17: [2, 24],
                    18: [2, 24],
                    21: [2, 24],
                    23: [2, 24],
                    24: [2, 24],
                    26: [2, 24],
                    27: [2, 24],
                    29: [2, 24]
                }, {
                    20: [2, 34],
                    22: [2, 34],
                    28: [2, 34],
                    37: [2, 34],
                    38: [2, 34],
                    39: [2, 34],
                    40: [2, 34],
                    41: [2, 34],
                    45: [2, 34],
                    47: [2, 34]
                }, {
                    20: [2, 36],
                    22: [2, 36],
                    28: [2, 36],
                    41: [2, 36],
                    45: [2, 36]
                }],
                defaultActions: {
                    3: [2, 2],
                    18: [2, 1],
                    47: [2, 18],
                    63: [2, 47],
                    74: [2, 45]
                },
                parseError: function s(x, w) {
                    throw new Error(x)
                },
                parse: function u(F) {
                    var M = this,
                        C = [0],
                        V = [null],
                        H = [],
                        W = this.table,
                        x = "",
                        G = 0,
                        T = 0,
                        z = 0,
                        E = 2,
                        J = 1;
                    this.lexer.setInput(F);
                    this.lexer.yy = this.yy;
                    this.yy.lexer = this.lexer;
                    this.yy.parser = this;
                    if (typeof this.lexer.yylloc == "undefined") {
                        this.lexer.yylloc = {}
                    }
                    var y = this.lexer.yylloc;
                    H.push(y);
                    var A = this.lexer.options && this.lexer.options.ranges;
                    if (typeof this.yy.parseError === "function") {
                        this.parseError = this.yy.parseError
                    }

                    function L(Y) {
                        C.length = C.length - 2 * Y;
                        V.length = V.length - Y;
                        H.length = H.length - Y
                    }

                    function K() {
                        var Y;
                        Y = M.lexer.lex() || 1;
                        if (typeof Y !== "number") {
                            Y = M.symbols_[Y] || Y
                        }
                        return Y
                    }
                    var S, O, B, R, X, I, Q = {},
                        N, U, w, D;
                    while (true) {
                        B = C[C.length - 1];
                        if (this.defaultActions[B]) {
                            R = this.defaultActions[B]
                        } else {
                            if (S === null || typeof S == "undefined") {
                                S = K()
                            }
                            R = W[B] && W[B][S]
                        }
                        if (typeof R === "undefined" || !R.length || !R[0]) {
                            var P = "";
                            if (!z) {
                                D = [];
                                for (N in W[B]) {
                                    if (this.terminals_[N] && N > 2) {
                                        D.push("'" + this.terminals_[N] + "'")
                                    }
                                }
                                if (this.lexer.showPosition) {
                                    P = "Parse error on line " + (G + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + D.join(", ") + ", got '" + (this.terminals_[S] || S) + "'"
                                } else {
                                    P = "Parse error on line " + (G + 1) + ": Unexpected " + (S == 1 ? "end of input" : "'" + (this.terminals_[S] || S) + "'")
                                }
                                this.parseError(P, {
                                    text: this.lexer.match,
                                    token: this.terminals_[S] || S,
                                    line: this.lexer.yylineno,
                                    loc: y,
                                    expected: D
                                })
                            }
                        }
                        if (R[0] instanceof Array && R.length > 1) {
                            throw new Error("Parse Error: multiple actions possible at state: " + B + ", token: " + S)
                        }
                        switch (R[0]) {
                            case 1:
                                C.push(S);
                                V.push(this.lexer.yytext);
                                H.push(this.lexer.yylloc);
                                C.push(R[1]);
                                S = null;
                                if (!O) {
                                    T = this.lexer.yyleng;
                                    x = this.lexer.yytext;
                                    G = this.lexer.yylineno;
                                    y = this.lexer.yylloc;
                                    if (z > 0) {
                                        z--
                                    }
                                } else {
                                    S = O;
                                    O = null
                                }
                                break;
                            case 2:
                                U = this.productions_[R[1]][1];
                                Q.$ = V[V.length - U];
                                Q._$ = {
                                    first_line: H[H.length - (U || 1)].first_line,
                                    last_line: H[H.length - 1].last_line,
                                    first_column: H[H.length - (U || 1)].first_column,
                                    last_column: H[H.length - 1].last_column
                                };
                                if (A) {
                                    Q._$.range = [H[H.length - (U || 1)].range[0], H[H.length - 1].range[1]]
                                }
                                I = this.performAction.call(Q, x, T, G, this.yy, R[1], V, H);
                                if (typeof I !== "undefined") {
                                    return I
                                }
                                if (U) {
                                    C = C.slice(0, -1 * U * 2);
                                    V = V.slice(0, -1 * U);
                                    H = H.slice(0, -1 * U)
                                }
                                C.push(this.productions_[R[1]][0]);
                                V.push(Q.$);
                                H.push(Q._$);
                                w = W[C[C.length - 2]][C[C.length - 1]];
                                C.push(w);
                                break;
                            case 3:
                                return true
                        }
                    }
                    return true
                }
            };

            function o(w, x) {
                return {
                    left: w.charAt(2) === "~",
                    right: x.charAt(0) === "~" || x.charAt(1) === "~"
                }
            }
            var p = (function() {
                var z = ({
                    EOF: 1,
                    parseError: function B(E, D) {
                        if (this.yy.parser) {
                            this.yy.parser.parseError(E, D)
                        } else {
                            throw new Error(E)
                        }
                    },
                    setInput: function(D) {
                        this._input = D;
                        this._more = this._less = this.done = false;
                        this.yylineno = this.yyleng = 0;
                        this.yytext = this.matched = this.match = "";
                        this.conditionStack = ["INITIAL"];
                        this.yylloc = {
                            first_line: 1,
                            first_column: 0,
                            last_line: 1,
                            last_column: 0
                        };
                        if (this.options.ranges) {
                            this.yylloc.range = [0, 0]
                        }
                        this.offset = 0;
                        return this
                    },
                    input: function() {
                        var E = this._input[0];
                        this.yytext += E;
                        this.yyleng++;
                        this.offset++;
                        this.match += E;
                        this.matched += E;
                        var D = E.match(/(?:\r\n?|\n).*/g);
                        if (D) {
                            this.yylineno++;
                            this.yylloc.last_line++
                        } else {
                            this.yylloc.last_column++
                        }
                        if (this.options.ranges) {
                            this.yylloc.range[1] ++
                        }
                        this._input = this._input.slice(1);
                        return E
                    },
                    unput: function(F) {
                        var D = F.length;
                        var E = F.split(/(?:\r\n?|\n)/g);
                        this._input = F + this._input;
                        this.yytext = this.yytext.substr(0, this.yytext.length - D - 1);
                        this.offset -= D;
                        var H = this.match.split(/(?:\r\n?|\n)/g);
                        this.match = this.match.substr(0, this.match.length - 1);
                        this.matched = this.matched.substr(0, this.matched.length - 1);
                        if (E.length - 1) {
                            this.yylineno -= E.length - 1
                        }
                        var G = this.yylloc.range;
                        this.yylloc = {
                            first_line: this.yylloc.first_line,
                            last_line: this.yylineno + 1,
                            first_column: this.yylloc.first_column,
                            last_column: E ? (E.length === H.length ? this.yylloc.first_column : 0) + H[H.length - E.length].length - E[0].length : this.yylloc.first_column - D
                        };
                        if (this.options.ranges) {
                            this.yylloc.range = [G[0], G[0] + this.yyleng - D]
                        }
                        return this
                    },
                    more: function() {
                        this._more = true;
                        return this
                    },
                    less: function(D) {
                        this.unput(this.match.slice(D))
                    },
                    pastInput: function() {
                        var D = this.matched.substr(0, this.matched.length - this.match.length);
                        return (D.length > 20 ? "..." : "") + D.substr(-20).replace(/\n/g, "")
                    },
                    upcomingInput: function() {
                        var D = this.match;
                        if (D.length < 20) {
                            D += this._input.substr(0, 20 - D.length)
                        }
                        return (D.substr(0, 20) + (D.length > 20 ? "..." : "")).replace(/\n/g, "")
                    },
                    showPosition: function() {
                        var D = this.pastInput();
                        var E = new Array(D.length + 1).join("-");
                        return D + this.upcomingInput() + "\n" + E + "^"
                    },
                    next: function() {
                        if (this.done) {
                            return this.EOF
                        }
                        if (!this._input) {
                            this.done = true
                        }
                        var J, H, E, G, F, D;
                        if (!this._more) {
                            this.yytext = "";
                            this.match = ""
                        }
                        var K = this._currentRules();
                        for (var I = 0; I < K.length; I++) {
                            E = this._input.match(this.rules[K[I]]);
                            if (E && (!H || E[0].length > H[0].length)) {
                                H = E;
                                G = I;
                                if (!this.options.flex) {
                                    break
                                }
                            }
                        }
                        if (H) {
                            D = H[0].match(/(?:\r\n?|\n).*/g);
                            if (D) {
                                this.yylineno += D.length
                            }
                            this.yylloc = {
                                first_line: this.yylloc.last_line,
                                last_line: this.yylineno + 1,
                                first_column: this.yylloc.last_column,
                                last_column: D ? D[D.length - 1].length - D[D.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + H[0].length
                            };
                            this.yytext += H[0];
                            this.match += H[0];
                            this.matches = H;
                            this.yyleng = this.yytext.length;
                            if (this.options.ranges) {
                                this.yylloc.range = [this.offset, this.offset += this.yyleng]
                            }
                            this._more = false;
                            this._input = this._input.slice(H[0].length);
                            this.matched += H[0];
                            J = this.performAction.call(this, this.yy, this, K[G], this.conditionStack[this.conditionStack.length - 1]);
                            if (this.done && this._input) {
                                this.done = false
                            }
                            if (J) {
                                return J
                            } else {
                                return
                            }
                        }
                        if (this._input === "") {
                            return this.EOF
                        } else {
                            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
                                text: "",
                                token: null,
                                line: this.yylineno
                            })
                        }
                    },
                    lex: function w() {
                        var D = this.next();
                        if (typeof D !== "undefined") {
                            return D
                        } else {
                            return this.lex()
                        }
                    },
                    begin: function x(D) {
                        this.conditionStack.push(D)
                    },
                    popState: function C() {
                        return this.conditionStack.pop()
                    },
                    _currentRules: function A() {
                        return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules
                    },
                    topState: function() {
                        return this.conditionStack[this.conditionStack.length - 2]
                    },
                    pushState: function x(D) {
                        this.begin(D)
                    }
                });
                z.options = {};
                z.performAction = function y(I, E, H, D) {
                    function F(K, J) {
                        return E.yytext = E.yytext.substr(K, E.yyleng - J)
                    }
                    var G = D;
                    switch (H) {
                        case 0:
                            if (E.yytext.slice(-2) === "\\\\") {
                                F(0, 1);
                                this.begin("mu")
                            } else {
                                if (E.yytext.slice(-1) === "\\") {
                                    F(0, 1);
                                    this.begin("emu")
                                } else {
                                    this.begin("mu")
                                }
                            }
                            if (E.yytext) {
                                return 10
                            }
                            break;
                        case 1:
                            return 10;
                            break;
                        case 2:
                            this.popState();
                            return 10;
                            break;
                        case 3:
                            E.yytext = E.yytext.substr(5, E.yyleng - 9);
                            this.popState();
                            return 11;
                            break;
                        case 4:
                            return 10;
                            break;
                        case 5:
                            F(0, 4);
                            this.popState();
                            return 17;
                            break;
                        case 6:
                            return 40;
                            break;
                        case 7:
                            return 41;
                            break;
                        case 8:
                            return 18;
                            break;
                        case 9:
                            this.popState();
                            this.begin("raw");
                            return 20;
                            break;
                        case 10:
                            E.yytext = E.yytext.substr(4, E.yyleng - 8);
                            this.popState();
                            return "RAW_BLOCK";
                            break;
                        case 11:
                            return 29;
                            break;
                        case 12:
                            return 21;
                            break;
                        case 13:
                            return 24;
                            break;
                        case 14:
                            return 23;
                            break;
                        case 15:
                            return 23;
                            break;
                        case 16:
                            return 27;
                            break;
                        case 17:
                            return 26;
                            break;
                        case 18:
                            this.popState();
                            this.begin("com");
                            break;
                        case 19:
                            F(3, 5);
                            this.popState();
                            return 17;
                            break;
                        case 20:
                            return 26;
                            break;
                        case 21:
                            return 46;
                            break;
                        case 22:
                            return 45;
                            break;
                        case 23:
                            return 45;
                            break;
                        case 24:
                            return 49;
                            break;
                        case 25:
                            break;
                        case 26:
                            this.popState();
                            return 28;
                            break;
                        case 27:
                            this.popState();
                            return 22;
                            break;
                        case 28:
                            E.yytext = F(1, 2).replace(/\\"/g, '"');
                            return 37;
                            break;
                        case 29:
                            E.yytext = F(1, 2).replace(/\\'/g, "'");
                            return 37;
                            break;
                        case 30:
                            return 47;
                            break;
                        case 31:
                            return 39;
                            break;
                        case 32:
                            return 39;
                            break;
                        case 33:
                            return 38;
                            break;
                        case 34:
                            return 45;
                            break;
                        case 35:
                            E.yytext = F(1, 2);
                            return 45;
                            break;
                        case 36:
                            return "INVALID";
                            break;
                        case 37:
                            return 5;
                            break
                    }
                };
                z.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]*?(?=(\{\{\{\{\/)))/, /^(?:[\s\S]*?--\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{\{\{[^\x00]*\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{!--)/, /^(?:\{\{![\s\S]*?\}\})/, /^(?:\{\{(~)?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:$)/];
                z.conditions = {
                    mu: {
                        rules: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
                        inclusive: false
                    },
                    emu: {
                        rules: [2],
                        inclusive: false
                    },
                    com: {
                        rules: [5],
                        inclusive: false
                    },
                    raw: {
                        rules: [3, 4],
                        inclusive: false
                    },
                    INITIAL: {
                        rules: [0, 1, 37],
                        inclusive: true
                    }
                };
                return z
            })();
            v.lexer = p;

            function t() {
                this.yy = {}
            }
            t.prototype = v;
            v.Parser = t;
            return new t
        })();
        n = m;
        return n
    })();
    var l = (function(q, m) {
        var n = {};
        var r = q;
        var o = m;
        n.parser = r;

        function p(s) {
            if (s.constructor === o.ProgramNode) {
                return s
            }
            r.yy = o;
            return r.parse(s)
        }
        n.parse = p;
        return n
    })(b, j);
    var e = (function(r) {
        var q = {};
        var m = r;

        function o() {}
        q.Compiler = o;
        o.prototype = {
            compiler: o,
            disassemble: function() {
                var x = this.opcodes,
                    w, u = [],
                    z, y;
                for (var v = 0, s = x.length; v < s; v++) {
                    w = x[v];
                    if (w.opcode === "DECLARE") {
                        u.push("DECLARE " + w.name + "=" + w.value)
                    } else {
                        z = [];
                        for (var t = 0; t < w.args.length; t++) {
                            y = w.args[t];
                            if (typeof y === "string") {
                                y = '"' + y.replace("\n", "\\n") + '"'
                            }
                            z.push(y)
                        }
                        u.push(w.opcode + " " + z.join(" "))
                    }
                }
                return u.join("\n")
            },
            equals: function(t) {
                var s = this.opcodes.length;
                if (t.opcodes.length !== s) {
                    return false
                }
                for (var w = 0; w < s; w++) {
                    var x = this.opcodes[w],
                        u = t.opcodes[w];
                    if (x.opcode !== u.opcode || x.args.length !== u.args.length) {
                        return false
                    }
                    for (var v = 0; v < x.args.length; v++) {
                        if (x.args[v] !== u.args[v]) {
                            return false
                        }
                    }
                }
                s = this.children.length;
                if (t.children.length !== s) {
                    return false
                }
                for (w = 0; w < s; w++) {
                    if (!this.children[w].equals(t.children[w])) {
                        return false
                    }
                }
                return true
            },
            guid: 0,
            compile: function(s, u) {
                this.opcodes = [];
                this.children = [];
                this.depths = {
                    list: []
                };
                this.options = u;
                this.stringParams = u.stringParams;
                this.trackIds = u.trackIds;
                var v = this.options.knownHelpers;
                this.options.knownHelpers = {
                    helperMissing: true,
                    blockHelperMissing: true,
                    each: true,
                    "if": true,
                    unless: true,
                    "with": true,
                    log: true,
                    lookup: true
                };
                if (v) {
                    for (var t in v) {
                        this.options.knownHelpers[t] = v[t]
                    }
                }
                return this.accept(s)
            },
            accept: function(u) {
                var t = u.strip || {},
                    s;
                if (t.left) {
                    this.opcode("strip")
                }
                s = this[u.type](u);
                if (t.right) {
                    this.opcode("strip")
                }
                return s
            },
            program: function(u) {
                var t = u.statements;
                for (var v = 0, s = t.length; v < s; v++) {
                    this.accept(t[v])
                }
                this.isSimple = s === 1;
                this.depths.list = this.depths.list.sort(function(x, w) {
                    return x - w
                });
                return this
            },
            compileProgram: function(u) {
                var s = new this.compiler().compile(u, this.options);
                var v = this.guid++,
                    x;
                this.usePartial = this.usePartial || s.usePartial;
                this.children[v] = s;
                for (var w = 0, t = s.depths.list.length; w < t; w++) {
                    x = s.depths.list[w];
                    if (x < 2) {
                        continue
                    } else {
                        this.addDepth(x - 1)
                    }
                }
                return v
            },
            block: function(x) {
                var w = x.mustache,
                    t = x.program,
                    s = x.inverse;
                if (t) {
                    t = this.compileProgram(t)
                }
                if (s) {
                    s = this.compileProgram(s)
                }
                var v = w.sexpr;
                var u = this.classifySexpr(v);
                if (u === "helper") {
                    this.helperSexpr(v, t, s)
                } else {
                    if (u === "simple") {
                        this.simpleSexpr(v);
                        this.opcode("pushProgram", t);
                        this.opcode("pushProgram", s);
                        this.opcode("emptyHash");
                        this.opcode("blockValue", v.id.original)
                    } else {
                        this.ambiguousSexpr(v, t, s);
                        this.opcode("pushProgram", t);
                        this.opcode("pushProgram", s);
                        this.opcode("emptyHash");
                        this.opcode("ambiguousBlockValue")
                    }
                }
                this.opcode("append")
            },
            hash: function(v) {
                var u = v.pairs,
                    t, s;
                this.opcode("pushHash");
                for (t = 0, s = u.length; t < s; t++) {
                    this.pushParam(u[t][1])
                }
                while (t--) {
                    this.opcode("assignToHash", u[t][0])
                }
                this.opcode("popHash")
            },
            partial: function(s) {
                var t = s.partialName;
                this.usePartial = true;
                if (s.hash) {
                    this.accept(s.hash)
                } else {
                    this.opcode("push", "undefined")
                }
                if (s.context) {
                    this.accept(s.context)
                } else {
                    this.opcode("push", "depth0")
                }
                this.opcode("invokePartial", t.name);
                this.opcode("append")
            },
            content: function(s) {
                this.opcode("appendContent", s.string)
            },
            mustache: function(s) {
                this.sexpr(s.sexpr);
                if (s.escaped && !this.options.noEscape) {
                    this.opcode("appendEscaped")
                } else {
                    this.opcode("append")
                }
            },
            ambiguousSexpr: function(w, u, t) {
                var x = w.id,
                    v = x.parts[0],
                    s = u != null || t != null;
                this.opcode("getContext", x.depth);
                this.opcode("pushProgram", u);
                this.opcode("pushProgram", t);
                this.opcode("invokeAmbiguous", v, s)
            },
            simpleSexpr: function(s) {
                var t = s.id;
                if (t.type === "DATA") {
                    this.DATA(t)
                } else {
                    if (t.parts.length) {
                        this.ID(t)
                    } else {
                        this.addDepth(t.depth);
                        this.opcode("getContext", t.depth);
                        this.opcode("pushContext")
                    }
                }
                this.opcode("resolvePossibleLambda")
            },
            helperSexpr: function(v, t, s) {
                var w = this.setupFullMustacheParams(v, t, s),
                    x = v.id,
                    u = x.parts[0];
                if (this.options.knownHelpers[u]) {
                    this.opcode("invokeKnownHelper", w.length, u)
                } else {
                    if (this.options.knownHelpersOnly) {
                        throw new m("You specified knownHelpersOnly, but used the unknown helper " + u, v)
                    } else {
                        this.ID(x);
                        this.opcode("invokeHelper", w.length, u, v.isRoot)
                    }
                }
            },
            sexpr: function(t) {
                var s = this.classifySexpr(t);
                if (s === "simple") {
                    this.simpleSexpr(t)
                } else {
                    if (s === "helper") {
                        this.helperSexpr(t)
                    } else {
                        this.ambiguousSexpr(t)
                    }
                }
            },
            ID: function(v) {
                this.addDepth(v.depth);
                this.opcode("getContext", v.depth);
                var t = v.parts[0];
                if (!t) {
                    this.opcode("pushContext")
                } else {
                    this.opcode("lookupOnContext", v.parts[0])
                }
                for (var u = 1, s = v.parts.length; u < s; u++) {
                    this.opcode("lookup", v.parts[u])
                }
            },
            DATA: function(u) {
                this.options.data = true;
                this.opcode("lookupData", u.id.depth);
                var v = u.id.parts;
                for (var t = 0, s = v.length; t < s; t++) {
                    this.opcode("lookup", v[t])
                }
            },
            STRING: function(s) {
                this.opcode("pushString", s.string)
            },
            NUMBER: function(s) {
                this.opcode("pushLiteral", s.number)
            },
            BOOLEAN: function(s) {
                this.opcode("pushLiteral", s.bool)
            },
            comment: function() {},
            opcode: function(s) {
                this.opcodes.push({
                    opcode: s,
                    args: [].slice.call(arguments, 1)
                })
            },
            declare: function(s, t) {
                this.opcodes.push({
                    opcode: "DECLARE",
                    name: s,
                    value: t
                })
            },
            addDepth: function(s) {
                if (s === 0) {
                    return
                }
                if (!this.depths[s]) {
                    this.depths[s] = true;
                    this.depths.list.push(s)
                }
            },
            classifySexpr: function(v) {
                var u = v.isHelper;
                var w = v.eligibleHelper;
                var t = this.options;
                if (w && !u) {
                    var s = v.id.parts[0];
                    if (t.knownHelpers[s]) {
                        u = true
                    } else {
                        if (t.knownHelpersOnly) {
                            w = false
                        }
                    }
                }
                if (u) {
                    return "helper"
                } else {
                    if (w) {
                        return "ambiguous"
                    } else {
                        return "simple"
                    }
                }
            },
            pushParams: function(u) {
                for (var t = 0, s = u.length; t < s; t++) {
                    this.pushParam(u[t])
                }
            },
            pushParam: function(s) {
                if (this.stringParams) {
                    if (s.depth) {
                        this.addDepth(s.depth)
                    }
                    this.opcode("getContext", s.depth || 0);
                    this.opcode("pushStringParam", s.stringModeValue, s.type);
                    if (s.type === "sexpr") {
                        this.sexpr(s)
                    }
                } else {
                    if (this.trackIds) {
                        this.opcode("pushId", s.type, s.idName || s.stringModeValue)
                    }
                    this.accept(s)
                }
            },
            setupFullMustacheParams: function(u, t, s) {
                var v = u.params;
                this.pushParams(v);
                this.opcode("pushProgram", t);
                this.opcode("pushProgram", s);
                if (u.hash) {
                    this.hash(u.hash)
                } else {
                    this.opcode("emptyHash")
                }
                return v
            }
        };

        function n(u, v, w) {
            if (u == null || (typeof u !== "string" && u.constructor !== w.AST.ProgramNode)) {
                throw new m("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + u)
            }
            v = v || {};
            if (!("data" in v)) {
                v.data = true
            }
            var t = w.parse(u);
            var s = new w.Compiler().compile(t, v);
            return new w.JavaScriptCompiler().compile(s, v)
        }
        q.precompile = n;

        function p(s, u, v) {
            if (s == null || (typeof s !== "string" && s.constructor !== v.AST.ProgramNode)) {
                throw new m("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + s)
            }
            u = u || {};
            if (!("data" in u)) {
                u.data = true
            }
            var x;

            function w() {
                var A = v.parse(s);
                var z = new v.Compiler().compile(A, u);
                var y = new v.JavaScriptCompiler().compile(z, u, undefined, true);
                return v.template(y)
            }
            var t = function(z, y) {
                if (!x) {
                    x = w()
                }
                return x.call(this, z, y)
            };
            t.child = function(y) {
                if (!x) {
                    x = w()
                }
                return x.child(y)
            };
            return t
        }
        q.compile = p;
        return q
    })(d);
    var h = (function(u, x) {
        var w;
        var m = u.COMPILER_REVISION;
        var q = u.REVISION_CHANGES;
        var r = u.log;
        var s = x;

        function o(z) {
            this.value = z
        }

        function y() {}
        y.prototype = {
            nameLookup: function(C, A) {
                var B, z;
                if (C.indexOf("depth") === 0) {
                    B = true
                }
                if (y.isValidJavaScriptVariableName(A)) {
                    z = C + "." + A
                } else {
                    z = C + "['" + A + "']"
                }
                if (B) {
                    return "(" + C + " && " + z + ")"
                } else {
                    return z
                }
            },
            compilerInfo: function() {
                var A = m,
                    z = q[A];
                return [A, z]
            },
            appendToBuffer: function(z) {
                if (this.environment.isSimple) {
                    return "return " + z + ";"
                } else {
                    return {
                        appendToBuffer: true,
                        content: z,
                        toString: function() {
                            return "buffer += " + z + ";"
                        }
                    }
                }
            },
            initializeBuffer: function() {
                return this.quotedString("")
            },
            namespace: "Handlebars",
            compile: function(C, J, z, F) {
                this.environment = C;
                this.options = J || {};
                this.stringParams = this.options.stringParams;
                this.trackIds = this.options.trackIds;
                this.precompile = !F;
                r("debug", this.environment.disassemble() + "\n\n");
                this.name = this.environment.name;
                this.isChild = !!z;
                this.context = z || {
                    programs: [],
                    environments: []
                };
                this.preamble();
                this.stackSlot = 0;
                this.stackVars = [];
                this.aliases = {};
                this.registers = {
                    list: []
                };
                this.hashes = [];
                this.compileStack = [];
                this.inlineStack = [];
                this.compileChildren(C, J);
                var H = C.opcodes,
                    D, E, B;
                for (E = 0, B = H.length; E < B; E++) {
                    D = H[E];
                    if (D.opcode === "DECLARE") {
                        this[D.name] = D.value
                    } else {
                        this[D.opcode].apply(this, D.args)
                    }
                    if (D.opcode !== this.stripNext) {
                        this.stripNext = false
                    }
                }
                this.pushSource("");
                if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
                    throw new s("Compile completed with content left on stack")
                }
                var I = this.createFunctionContext(F);
                if (!this.isChild) {
                    var G = {
                        compiler: this.compilerInfo(),
                        main: I
                    };
                    var A = this.context.programs;
                    for (E = 0, B = A.length; E < B; E++) {
                        if (A[E]) {
                            G[E] = A[E]
                        }
                    }
                    if (this.environment.usePartial) {
                        G.usePartial = true
                    }
                    if (this.options.data) {
                        G.useData = true
                    }
                    if (!F) {
                        G.compiler = JSON.stringify(G.compiler);
                        G = this.objectLiteral(G)
                    }
                    return G
                } else {
                    return I
                }
            },
            preamble: function() {
                this.lastContext = 0;
                this.source = []
            },
            createFunctionContext: function(C) {
                var F = "";
                var E = this.stackVars.concat(this.registers.list);
                if (E.length > 0) {
                    F += ", " + E.join(", ")
                }
                for (var B in this.aliases) {
                    if (this.aliases.hasOwnProperty(B)) {
                        F += ", " + B + "=" + this.aliases[B]
                    }
                }
                var G = ["depth0", "helpers", "partials", "data"];
                for (var A = 0, z = this.environment.depths.list.length; A < z; A++) {
                    G.push("depth" + this.environment.depths.list[A])
                }
                var D = this.mergeSource(F);
                if (C) {
                    G.push(D);
                    return Function.apply(this, G)
                } else {
                    return "function(" + G.join(",") + ") {\n  " + D + "}"
                }
            },
            mergeSource: function(G) {
                var F = "",
                    C, D = !this.forceBuffer,
                    A;
                for (var E = 0, z = this.source.length; E < z; E++) {
                    var B = this.source[E];
                    if (B.appendToBuffer) {
                        if (C) {
                            C = C + "\n    + " + B.content
                        } else {
                            C = B.content
                        }
                    } else {
                        if (C) {
                            if (!F) {
                                A = true;
                                F = C + ";\n  "
                            } else {
                                F += "buffer += " + C + ";\n  "
                            }
                            C = undefined
                        }
                        F += B + "\n  ";
                        if (!this.environment.isSimple) {
                            D = false
                        }
                    }
                }
                if (D) {
                    if (C || !F) {
                        F += "return " + (C || '""') + ";\n"
                    }
                } else {
                    G += ", buffer = " + (A ? "" : this.initializeBuffer());
                    if (C) {
                        F += "return buffer + " + C + ";\n"
                    } else {
                        F += "return buffer;\n"
                    }
                }
                if (G) {
                    F = "var " + G.substring(2) + (A ? "" : ";\n  ") + F
                }
                return F
            },
            blockValue: function(z) {
                this.aliases.blockHelperMissing = "helpers.blockHelperMissing";
                var A = ["depth0"];
                this.setupParams(z, 0, A);
                this.replaceStack(function(B) {
                    A.splice(1, 0, B);
                    return "blockHelperMissing.call(" + A.join(", ") + ")"
                })
            },
            ambiguousBlockValue: function() {
                this.aliases.blockHelperMissing = "helpers.blockHelperMissing";
                var A = ["depth0"];
                this.setupParams("", 0, A, true);
                this.flushInline();
                var z = this.topStack();
                A.splice(1, 0, z);
                this.pushSource("if (!" + this.lastHelper + ") { " + z + " = blockHelperMissing.call(" + A.join(", ") + "); }")
            },
            appendContent: function(z) {
                if (this.pendingContent) {
                    z = this.pendingContent + z
                }
                if (this.stripNext) {
                    z = z.replace(/^\s+/, "")
                }
                this.pendingContent = z
            },
            strip: function() {
                if (this.pendingContent) {
                    this.pendingContent = this.pendingContent.replace(/\s+$/, "")
                }
                this.stripNext = "strip"
            },
            append: function() {
                this.flushInline();
                var z = this.popStack();
                this.pushSource("if(" + z + " || " + z + " === 0) { " + this.appendToBuffer(z) + " }");
                if (this.environment.isSimple) {
                    this.pushSource("else { " + this.appendToBuffer("''") + " }")
                }
            },
            appendEscaped: function() {
                this.aliases.escapeExpression = "this.escapeExpression";
                this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"))
            },
            getContext: function(z) {
                if (this.lastContext !== z) {
                    this.lastContext = z
                }
            },
            lookupOnContext: function(z) {
                this.push(this.nameLookup("depth" + this.lastContext, z, "context"))
            },
            pushContext: function() {
                this.pushStackLiteral("depth" + this.lastContext)
            },
            resolvePossibleLambda: function() {
                this.aliases.functionType = '"function"';
                this.replaceStack(function(z) {
                    return "typeof " + z + " === functionType ? " + z + ".apply(depth0) : " + z
                })
            },
            lookup: function(z) {
                this.replaceStack(function(A) {
                    return A + " == null || " + A + " === false ? " + A + " : " + this.nameLookup(A, z, "context")
                })
            },
            lookupData: function(z) {
                if (!z) {
                    this.pushStackLiteral("data")
                } else {
                    this.pushStackLiteral("this.data(data, " + z + ")")
                }
            },
            pushStringParam: function(z, A) {
                this.pushStackLiteral("depth" + this.lastContext);
                this.pushString(A);
                if (A !== "sexpr") {
                    if (typeof z === "string") {
                        this.pushString(z)
                    } else {
                        this.pushStackLiteral(z)
                    }
                }
            },
            emptyHash: function() {
                this.pushStackLiteral("{}");
                if (this.trackIds) {
                    this.push("{}")
                }
                if (this.stringParams) {
                    this.push("{}");
                    this.push("{}")
                }
            },
            pushHash: function() {
                if (this.hash) {
                    this.hashes.push(this.hash)
                }
                this.hash = {
                    values: [],
                    types: [],
                    contexts: [],
                    ids: []
                }
            },
            popHash: function() {
                var z = this.hash;
                this.hash = this.hashes.pop();
                if (this.trackIds) {
                    this.push("{" + z.ids.join(",") + "}")
                }
                if (this.stringParams) {
                    this.push("{" + z.contexts.join(",") + "}");
                    this.push("{" + z.types.join(",") + "}")
                }
                this.push("{\n    " + z.values.join(",\n    ") + "\n  }")
            },
            pushString: function(z) {
                this.pushStackLiteral(this.quotedString(z))
            },
            push: function(z) {
                this.inlineStack.push(z);
                return z
            },
            pushLiteral: function(z) {
                this.pushStackLiteral(z)
            },
            pushProgram: function(z) {
                if (z != null) {
                    this.pushStackLiteral(this.programExpression(z))
                } else {
                    this.pushStackLiteral(null)
                }
            },
            invokeHelper: function(D, A, z) {
                this.aliases.helperMissing = "helpers.helperMissing";
                this.useRegister("helper");
                var E = this.popStack();
                var B = this.setupHelper(D, A);
                var C = "helper = " + B.name + " || " + E + " || helperMissing";
                if (B.paramsInit) {
                    C += "," + B.paramsInit
                }
                this.push("(" + C + ",helper.call(" + B.callParams + "))");
                if (!z) {
                    this.flushInline()
                }
            },
            invokeKnownHelper: function(B, z) {
                var A = this.setupHelper(B, z);
                this.push(A.name + ".call(" + A.callParams + ")")
            },
            invokeAmbiguous: function(z, C) {
                this.aliases.functionType = '"function"';
                this.useRegister("helper");
                this.emptyHash();
                var A = this.setupHelper(0, z, C);
                var B = this.lastHelper = this.nameLookup("helpers", z, "helper");
                var D = this.nameLookup("depth" + this.lastContext, z, "context");
                this.push("((helper = " + B + " || " + D + (A.paramsInit ? "),(" + A.paramsInit : "") + "),(typeof helper === functionType ? helper.call(" + A.callParams + ") : helper))")
            },
            invokePartial: function(z) {
                var A = [this.nameLookup("partials", z, "partial"), "'" + z + "'", this.popStack(), this.popStack(), "helpers", "partials"];
                if (this.options.data) {
                    A.push("data")
                }
                this.push("this.invokePartial(" + A.join(", ") + ")")
            },
            assignToHash: function(A) {
                var C = this.popStack(),
                    z, B, E;
                if (this.trackIds) {
                    E = this.popStack()
                }
                if (this.stringParams) {
                    B = this.popStack();
                    z = this.popStack()
                }
                var D = this.hash;
                if (z) {
                    D.contexts.push("'" + A + "': " + z)
                }
                if (B) {
                    D.types.push("'" + A + "': " + B)
                }
                if (E) {
                    D.ids.push("'" + A + "': " + E)
                }
                D.values.push("'" + A + "': (" + C + ")")
            },
            pushId: function(A, z) {
                if (A === "ID" || A === "DATA") {
                    this.pushString(z)
                } else {
                    if (A === "sexpr") {
                        this.pushStackLiteral("true")
                    } else {
                        this.pushStackLiteral("null")
                    }
                }
            },
            compiler: y,
            compileChildren: function(z, C) {
                var E = z.children,
                    G, F;
                for (var D = 0, A = E.length; D < A; D++) {
                    G = E[D];
                    F = new this.compiler();
                    var B = this.matchExistingProgram(G);
                    if (B == null) {
                        this.context.programs.push("");
                        B = this.context.programs.length;
                        G.index = B;
                        G.name = "program" + B;
                        this.context.programs[B] = F.compile(G, C, this.context, !this.precompile);
                        this.context.environments[B] = G
                    } else {
                        G.index = B;
                        G.name = "program" + B
                    }
                }
            },
            matchExistingProgram: function(C) {
                for (var B = 0, A = this.context.environments.length; B < A; B++) {
                    var z = this.context.environments[B];
                    if (z && z.equals(C)) {
                        return B
                    }
                }
            },
            programExpression: function(A) {
                if (A == null) {
                    return "this.noop"
                }
                var F = this.environment.children[A],
                    E = F.depths.list,
                    D;
                var C = [F.index, "data"];
                for (var B = 0, z = E.length; B < z; B++) {
                    D = E[B];
                    C.push("depth" + (D - 1))
                }
                return (E.length === 0 ? "this.program(" : "this.programWithDepth(") + C.join(", ") + ")"
            },
            register: function(z, A) {
                this.useRegister(z);
                this.pushSource(z + " = " + A + ";")
            },
            useRegister: function(z) {
                if (!this.registers[z]) {
                    this.registers[z] = true;
                    this.registers.list.push(z)
                }
            },
            pushStackLiteral: function(z) {
                return this.push(new o(z))
            },
            pushSource: function(z) {
                if (this.pendingContent) {
                    this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
                    this.pendingContent = undefined
                }
                if (z) {
                    this.source.push(z)
                }
            },
            pushStack: function(A) {
                this.flushInline();
                var z = this.incrStack();
                if (A) {
                    this.pushSource(z + " = " + A + ";")
                }
                this.compileStack.push(z);
                return z
            },
            replaceStack: function(G) {
                var B = "",
                    C = this.isInline(),
                    F, A, D;
                if (C) {
                    var E = this.popStack(true);
                    if (E instanceof o) {
                        F = E.value;
                        D = true
                    } else {
                        A = !this.stackSlot;
                        var z = !A ? this.topStackName() : this.incrStack();
                        B = "(" + this.push(z) + " = " + E + "),";
                        F = this.topStack()
                    }
                } else {
                    F = this.topStack()
                }
                var H = G.call(this, F);
                if (C) {
                    if (!D) {
                        this.popStack()
                    }
                    if (A) {
                        this.stackSlot--
                    }
                    this.push("(" + B + H + ")")
                } else {
                    if (!/^stack/.test(F)) {
                        F = this.nextStack()
                    }
                    this.pushSource(F + " = (" + B + H + ");")
                }
                return F
            },
            nextStack: function() {
                return this.pushStack()
            },
            incrStack: function() {
                this.stackSlot++;
                if (this.stackSlot > this.stackVars.length) {
                    this.stackVars.push("stack" + this.stackSlot)
                }
                return this.topStackName()
            },
            topStackName: function() {
                return "stack" + this.stackSlot
            },
            flushInline: function() {
                var B = this.inlineStack;
                if (B.length) {
                    this.inlineStack = [];
                    for (var A = 0, z = B.length; A < z; A++) {
                        var C = B[A];
                        if (C instanceof o) {
                            this.compileStack.push(C)
                        } else {
                            this.pushStack(C)
                        }
                    }
                }
            },
            isInline: function() {
                return this.inlineStack.length
            },
            popStack: function(z) {
                var B = this.isInline(),
                    A = (B ? this.inlineStack : this.compileStack).pop();
                if (!z && (A instanceof o)) {
                    return A.value
                } else {
                    if (!B) {
                        if (!this.stackSlot) {
                            throw new s("Invalid stack pop")
                        }
                        this.stackSlot--
                    }
                    return A
                }
            },
            topStack: function(A) {
                var z = (this.isInline() ? this.inlineStack : this.compileStack),
                    B = z[z.length - 1];
                if (!A && (B instanceof o)) {
                    return B.value
                } else {
                    return B
                }
            },
            quotedString: function(z) {
                return '"' + z.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + '"'
            },
            objectLiteral: function(B) {
                var A = [];
                for (var z in B) {
                    if (B.hasOwnProperty(z)) {
                        A.push(this.quotedString(z) + ":" + B[z])
                    }
                }
                return "{" + A.join(",") + "}"
            },
            setupHelper: function(D, B, A) {
                var C = [],
                    E = this.setupParams(B, D, C, A);
                var z = this.nameLookup("helpers", B, "helper");
                return {
                    params: C,
                    paramsInit: E,
                    name: z,
                    callParams: ["depth0"].concat(C).join(", ")
                }
            },
            setupOptions: function(A, E, C) {
                var J = {},
                    H = [],
                    I = [],
                    z = [],
                    B, D, G;
                J.name = this.quotedString(A);
                J.hash = this.popStack();
                if (this.trackIds) {
                    J.hashIds = this.popStack()
                }
                if (this.stringParams) {
                    J.hashTypes = this.popStack();
                    J.hashContexts = this.popStack()
                }
                D = this.popStack();
                G = this.popStack();
                if (G || D) {
                    if (!G) {
                        G = "this.noop"
                    }
                    if (!D) {
                        D = "this.noop"
                    }
                    J.fn = G;
                    J.inverse = D
                }
                var F = E;
                while (F--) {
                    B = this.popStack();
                    C[F] = B;
                    if (this.trackIds) {
                        z[F] = this.popStack()
                    }
                    if (this.stringParams) {
                        I[F] = this.popStack();
                        H[F] = this.popStack()
                    }
                }
                if (this.trackIds) {
                    J.ids = "[" + z.join(",") + "]"
                }
                if (this.stringParams) {
                    J.types = "[" + I.join(",") + "]";
                    J.contexts = "[" + H.join(",") + "]"
                }
                if (this.options.data) {
                    J.data = "data"
                }
                return J
            },
            setupParams: function(B, D, C, A) {
                var z = this.objectLiteral(this.setupOptions(B, D, C));
                if (A) {
                    this.useRegister("options");
                    C.push("options");
                    return "options=" + z
                } else {
                    C.push(z);
                    return ""
                }
            }
        };
        var n = ("break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield").split(" ");
        var v = y.RESERVED_WORDS = {};
        for (var t = 0, p = n.length; t < p; t++) {
            v[n[t]] = true
        }
        y.isValidJavaScriptVariableName = function(z) {
            return !y.RESERVED_WORDS[z] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(z)
        };
        w = y;
        return w
    })(i, d);
    var c = (function(v, A, n, r, u) {
        var x;
        var m = v;
        var t = A;
        var q = n.parser;
        var p = n.parse;
        var w = r.Compiler;
        var z = r.compile;
        var o = r.precompile;
        var B = u;
        var y = m.create;
        var s = function() {
            var C = y();
            C.compile = function(D, E) {
                return z(D, E, C)
            };
            C.precompile = function(D, E) {
                return o(D, E, C)
            };
            C.AST = t;
            C.Compiler = w;
            C.JavaScriptCompiler = B;
            C.Parser = q;
            C.parse = p;
            return C
        };
        m = s();
        m.create = s;
        x = m;
        return x
    })(f, j, l, e, h);
    return c
})();
(function(a) {
    if (typeof exports == "object" && typeof module == "object") {
        module.exports = a()
    } else {
        if (typeof define == "function" && define.amd) {
            return define([], a)
        } else {
            this.CodeMirror = a()
        }
    }
})(function() {
    var b0 = /gecko\/\d/i.test(navigator.userAgent);
    var d3 = /MSIE \d/.test(navigator.userAgent);
    var bN = d3 && (document.documentMode == null || document.documentMode < 8);
    var bK = d3 && (document.documentMode == null || document.documentMode < 9);
    var bl = /Trident\/([7-9]|\d{2,})\./.test(navigator.userAgent);
    var c5 = d3 || bl;
    var cv = /WebKit\//.test(navigator.userAgent);
    var c8 = cv && /Qt\/\d+\.\d+/.test(navigator.userAgent);
    var cH = /Chrome\//.test(navigator.userAgent);
    var dl = /Opera\//.test(navigator.userAgent);
    var an = /Apple Computer/.test(navigator.vendor);
    var aR = /KHTML\//.test(navigator.userAgent);
    var ce = /Mac OS X 1\d\D([7-9]|\d\d)\D/.test(navigator.userAgent);
    var cB = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(navigator.userAgent);
    var eH = /PhantomJS/.test(navigator.userAgent);
    var eh = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
    var dz = eh || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(navigator.userAgent);
    var bH = eh || /Mac/.test(navigator.platform);
    var aw = /win/i.test(navigator.platform);
    var aE = dl && navigator.userAgent.match(/Version\/(\d*\.\d*)/);
    if (aE) {
        aE = Number(aE[1])
    }
    if (aE && aE >= 15) {
        dl = false;
        cv = true
    }
    var bs = bH && (c8 || dl && (aE == null || aE < 12.11));
    var fd = b0 || (c5 && !bK);
    var ff = false,
        aN = false;

    function C(fm, fn) {
        if (!(this instanceof C)) {
            return new C(fm, fn)
        }
        this.options = fn = fn || {};
        for (var fo in ej) {
            if (!fn.hasOwnProperty(fo)) {
                fn[fo] = ej[fo]
            }
        }
        bQ(fn);
        var fr = typeof fn.value == "string" ? 0 : fn.value.first;
        var fq = this.display = new d1(fm, fr);
        fq.wrapper.CodeMirror = this;
        dv(this);
        co(this);
        if (fn.lineWrapping) {
            this.display.wrapper.className += " CodeMirror-wrap"
        }
        if (fn.autofocus && !dz) {
            dT(this)
        }
        this.state = {
            keyMaps: [],
            overlays: [],
            modeGen: 0,
            overwrite: false,
            focused: false,
            suppressEdits: false,
            pasteIncoming: false,
            cutIncoming: false,
            draggingText: false,
            highlight: new fk()
        };
        var fp = fn.value;
        if (typeof fp == "string") {
            fp = new ah(fp, fn.mode)
        }
        if (d3) {
            setTimeout(b7(eC, this, true), 20)
        }
        eZ(this);
        var fl = this;
        cm(this, function() {
            fl.curOp.forceUpdate = true;
            du(fl, fp);
            if ((fn.autofocus && !dz) || c9() == fq.input) {
                setTimeout(b7(cc, fl), 20)
            } else {
                aA(fl)
            }
            for (var ft in aU) {
                if (aU.hasOwnProperty(ft)) {
                    aU[ft](fl, fn[ft], bO)
                }
            }
            for (var fs = 0; fs < aO.length;
                ++fs) {
                aO[fs](fl)
            }
        })
    }

    function d1(fl, fn) {
        var fo = this;
        var fm = fo.input = e5("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em; outline: none");
        if (cv) {
            fm.style.width = "1000px"
        } else {
            fm.setAttribute("wrap", "off")
        }
        if (eh) {
            fm.style.border = "1px solid black"
        }
        fm.setAttribute("autocorrect", "off");
        fm.setAttribute("autocapitalize", "off");
        fm.setAttribute("spellcheck", "false");
        fo.inputDiv = e5("div", [fm], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
        fo.scrollbarH = e5("div", [e5("div", null, null, "height: 1px")], "CodeMirror-hscrollbar");
        fo.scrollbarV = e5("div", [e5("div", null, null, "width: 1px")], "CodeMirror-vscrollbar");
        fo.scrollbarFiller = e5("div", null, "CodeMirror-scrollbar-filler");
        fo.gutterFiller = e5("div", null, "CodeMirror-gutter-filler");
        fo.lineDiv = e5("div", null, "CodeMirror-code");
        fo.selectionDiv = e5("div", null, null, "z-index: 1");
        fo.cursorDiv = e5("div", null, "CodeMirror-cursors");
        fo.measure = e5("div", null, "CodeMirror-measure");
        fo.lineMeasure = e5("div", null, "CodeMirror-measure");
        fo.lineSpace = e5("div", [fo.measure, fo.lineMeasure, fo.selectionDiv, fo.lineDiv, fo.cursorDiv], null, "position: relative; outline: none");
        fo.mover = e5("div", [e5("div", [fo.lineSpace], "CodeMirror-lines")], null, "position: relative");
        fo.sizer = e5("div", [fo.mover], "CodeMirror-sizer");
        fo.heightForcer = e5("div", null, null, "position: absolute; height: " + aZ + "px; width: 1px;");
        fo.gutters = e5("div", null, "CodeMirror-gutters");
        fo.lineGutter = null;
        fo.scroller = e5("div", [fo.sizer, fo.heightForcer, fo.gutters], "CodeMirror-scroll");
        fo.scroller.setAttribute("tabIndex", "-1");
        fo.wrapper = e5("div", [fo.inputDiv, fo.scrollbarH, fo.scrollbarV, fo.scrollbarFiller, fo.gutterFiller, fo.scroller], "CodeMirror");
        if (bN) {
            fo.gutters.style.zIndex = -1;
            fo.scroller.style.paddingRight = 0
        }
        if (eh) {
            fm.style.width = "0px"
        }
        if (!cv) {
            fo.scroller.draggable = true
        }
        if (aR) {
            fo.inputDiv.style.height = "1px";
            fo.inputDiv.style.position = "absolute"
        }
        if (bN) {
            fo.scrollbarH.style.minHeight = fo.scrollbarV.style.minWidth = "18px"
        }
        if (fl.appendChild) {
            fl.appendChild(fo.wrapper)
        } else {
            fl(fo.wrapper)
        }
        fo.viewFrom = fo.viewTo = fn;
        fo.view = [];
        fo.externalMeasured = null;
        fo.viewOffset = 0;
        fo.lastSizeC = 0;
        fo.updateLineNumbers = null;
        fo.lineNumWidth = fo.lineNumInnerWidth = fo.lineNumChars = null;
        fo.prevInput = "";
        fo.alignWidgets = false;
        fo.pollingFast = false;
        fo.poll = new fk();
        fo.cachedCharWidth = fo.cachedTextHeight = null;
        fo.inaccurateSelection = false;
        fo.maxLine = null;
        fo.maxLineLength = 0;
        fo.maxLineChanged = false;
        fo.wheelDX = fo.wheelDY = fo.wheelStartX = fo.wheelStartY = null;
        fo.shift = false
    }

    function a6(fl) {
        fl.doc.mode = C.getMode(fl.options, fl.doc.modeOption);
        dE(fl)
    }

    function dE(fl) {
        fl.doc.iter(function(fm) {
            if (fm.stateAfter) {
                fm.stateAfter = null
            }
            if (fm.styles) {
                fm.styles = null
            }
        });
        fl.doc.frontier = fl.doc.first;
        dy(fl, 100);
        fl.state.modeGen++;
        if (fl.curOp) {
            W(fl)
        }
    }

    function dZ(fl) {
        if (fl.options.lineWrapping) {
            fl.display.wrapper.className += " CodeMirror-wrap";
            fl.display.sizer.style.minWidth = ""
        } else {
            fl.display.wrapper.className = fl.display.wrapper.className.replace(" CodeMirror-wrap", "");
            e8(fl)
        }
        P(fl);
        W(fl);
        Z(fl);
        setTimeout(function() {
            ef(fl)
        }, 100)
    }

    function aT(fl) {
        var fn = aD(fl.display),
            fm = fl.options.lineWrapping;
        var fo = fm && Math.max(5, fl.display.scroller.clientWidth / c1(fl.display) - 3);
        return function(fp) {
            if (eJ(fl.doc, fp)) {
                return 0
            } else {
                if (fm) {
                    return (Math.ceil(fp.text.length / fo) || 1) * fn
                } else {
                    return fn
                }
            }
        }
    }

    function P(fl) {
        var fn = fl.doc,
            fm = aT(fl);
        fn.iter(function(fo) {
            var fp = fm(fo);
            if (fp != fo.height) {
                e9(fo, fp)
            }
        })
    }

    function fi(fl) {
        var fn = en[fl.options.keyMap],
            fm = fn.style;
        fl.display.wrapper.className = fl.display.wrapper.className.replace(/\s*cm-keymap-\S+/g, "") + (fm ? " cm-keymap-" + fm : "")
    }

    function co(fl) {
        fl.display.wrapper.className = fl.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") + fl.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
        Z(fl)
    }

    function cV(fl) {
        dv(fl);
        W(fl);
        setTimeout(function() {
            dX(fl)
        }, 20)
    }

    function dv(fl) {
        var fm = fl.display.gutters,
            fr = fl.options.gutters;
        dk(fm);
        for (var fn = 0; fn < fr.length;
            ++fn) {
            var fp = fr[fn];
            var fq = fm.appendChild(e5("div", null, "CodeMirror-gutter " + fp));
            if (fp == "CodeMirror-linenumbers") {
                fl.display.lineGutter = fq;
                fq.style.width = (fl.display.lineNumWidth || 1) + "px"
            }
        }
        fm.style.display = fn ? "" : "none";
        var fo = fm.offsetWidth;
        fl.display.sizer.style.marginLeft = fo + "px";
        if (fn) {
            fl.display.scrollbarH.style.left = fl.options.fixedGutter ? fo + "px" : 0
        }
    }

    function dF(fn) {
        if (fn.height == 0) {
            return 0
        }
        var fm = fn.text.length,
            fl, fp = fn;
        while (fl = d6(fp)) {
            var fo = fl.find(0, true);
            fp = fo.from.line;
            fm += fo.from.ch - fo.to.ch
        }
        fp = fn;
        while (fl = dN(fp)) {
            var fo = fl.find(0, true);
            fm -= fp.text.length - fo.from.ch;
            fp = fo.to.line;
            fm += fp.text.length - fo.to.ch
        }
        return fm
    }

    function e8(fl) {
        var fn = fl.display,
            fm = fl.doc;
        fn.maxLine = es(fm, fm.first);
        fn.maxLineLength = dF(fn.maxLine);
        fn.maxLineChanged = true;
        fm.iter(function(fp) {
            var fo = dF(fp);
            if (fo > fn.maxLineLength) {
                fn.maxLineLength = fo;
                fn.maxLine = fp
            }
        })
    }

    function bQ(fl) {
        var fm = cM(fl.gutters, "CodeMirror-linenumbers");
        if (fm == -1 && fl.lineNumbers) {
            fl.gutters = fl.gutters.concat(["CodeMirror-linenumbers"])
        } else {
            if (fm > -1 && !fl.lineNumbers) {
                fl.gutters = fl.gutters.slice(0);
                fl.gutters.splice(fm, 1)
            }
        }
    }

    function cY(fm) {
        var fl = fm.display.scroller;
        return {
            scrollHeight: fl.scrollHeight,
            clientHeight: fl.clientHeight,
            barHeight: fm.display.scrollbarV.clientHeight,
            scrollWidth: fl.scrollWidth,
            clientWidth: fl.clientWidth,
            barWidth: fm.display.scrollbarH.clientWidth,
            paddingVert: bk(fm.display)
        }
    }

    function ef(fl, fq) {
        if (!fq) {
            fq = cY(fl)
        }
        var fs = fl.display,
            fm = fl.doc.height;
        var fo = fm + fq.paddingVert;
        fs.sizer.style.minHeight = fs.heightForcer.style.top = fo + "px";
        fs.gutters.style.height = Math.max(fo, fq.clientHeight - aZ) + "px";
        var fp = Math.max(fo, fq.scrollHeight);
        var fr = fq.scrollWidth > fq.clientWidth;
        var fn = fp > fq.clientHeight;
        if (fn) {
            fs.scrollbarV.style.display = "block";
            fs.scrollbarV.style.bottom = fr ? i(fs.measure) + "px" : "0";
            fs.scrollbarV.firstChild.style.height = Math.max(0, fp - fq.clientHeight + (fq.barHeight || fs.scrollbarV.clientHeight)) + "px"
        } else {
            fs.scrollbarV.style.display = "";
            fs.scrollbarV.firstChild.style.height = "0"
        }
        if (fr) {
            fs.scrollbarH.style.display = "block";
            fs.scrollbarH.style.right = fn ? i(fs.measure) + "px" : "0";
            fs.scrollbarH.firstChild.style.width = (fq.scrollWidth - fq.clientWidth + (fq.barWidth || fs.scrollbarH.clientWidth)) + "px"
        } else {
            fs.scrollbarH.style.display = "";
            fs.scrollbarH.firstChild.style.width = "0"
        }
        if (fr && fn) {
            fs.scrollbarFiller.style.display = "block";
            fs.scrollbarFiller.style.height = fs.scrollbarFiller.style.width = i(fs.measure) + "px"
        } else {
            fs.scrollbarFiller.style.display = ""
        }
        if (fr && fl.options.coverGutterNextToScrollbar && fl.options.fixedGutter) {
            fs.gutterFiller.style.display = "block";
            fs.gutterFiller.style.height = i(fs.measure) + "px";
            fs.gutterFiller.style.width = fs.gutters.offsetWidth + "px"
        } else {
            fs.gutterFiller.style.display = ""
        }
        if (ce && i(fs.measure) === 0) {
            fs.scrollbarV.style.minWidth = fs.scrollbarH.style.minHeight = cB ? "18px" : "12px";
            fs.scrollbarV.style.pointerEvents = fs.scrollbarH.style.pointerEvents = "none"
        }
    }

    function bG(fn, fr, fu) {
        var fo = fu && fu.top != null ? fu.top : fn.scroller.scrollTop;
        var fs = fu && fu.height || fn.wrapper.clientHeight;
        fo = Math.floor(fo - el(fn));
        var fl = Math.ceil(fo + fs);
        var fp = bi(fr, fo),
            fq = bi(fr, fl);
        if (fu && fu.ensure) {
            var fm = fu.ensure.from.line,
                ft = fu.ensure.to.line;
            if (fm < fp) {
                return {
                    from: fm,
                    to: bi(fr, bo(es(fr, fm)) - fn.wrapper.clientHeight)
                }
            }
            if (Math.min(ft, fr.lastLine()) >= fq) {
                return {
                    from: bi(fr, bo(es(fr, ft)) + fn.wrapper.clientHeight),
                    to: ft
                }
            }
        }
        return {
            from: fp,
            to: fq
        }
    }

    function dX(ft) {
        var fr = ft.display,
            fs = fr.view;
        if (!fr.alignWidgets && (!fr.gutters.firstChild || !ft.options.fixedGutter)) {
            return
        }
        var fp = dh(fr) - fr.scroller.scrollLeft + ft.doc.scrollLeft;
        var fl = fr.gutters.offsetWidth,
            fm = fp + "px";
        for (var fo = 0; fo < fs.length; fo++) {
            if (!fs[fo].hidden) {
                if (ft.options.fixedGutter && fs[fo].gutter) {
                    fs[fo].gutter.style.left = fm
                }
                var fq = fs[fo].alignable;
                if (fq) {
                    for (var fn = 0; fn < fq.length; fn++) {
                        fq[fn].style.left = fm
                    }
                }
            }
        }
        if (ft.options.fixedGutter) {
            fr.gutters.style.left = (fp + fl) + "px"
        }
    }

    function dp(fl) {
        if (!fl.options.lineNumbers) {
            return false
        }
        var fr = fl.doc,
            fn = dK(fl.options, fr.first + fr.size - 1),
            fq = fl.display;
        if (fn.length != fq.lineNumChars) {
            var fs = fq.measure.appendChild(e5("div", [e5("div", fn)], "CodeMirror-linenumber CodeMirror-gutter-elt"));
            var fo = fs.firstChild.offsetWidth,
                fp = fs.offsetWidth - fo;
            fq.lineGutter.style.width = "";
            fq.lineNumInnerWidth = Math.max(fo, fq.lineGutter.offsetWidth - fp);
            fq.lineNumWidth = fq.lineNumInnerWidth + fp;
            fq.lineNumChars = fq.lineNumInnerWidth ? fn.length : -1;
            fq.lineGutter.style.width = fq.lineNumWidth + "px";
            var fm = fq.gutters.offsetWidth;
            fq.scrollbarH.style.left = fl.options.fixedGutter ? fm + "px" : 0;
            fq.sizer.style.marginLeft = fm + "px";
            return true
        }
        return false
    }

    function dK(fl, fm) {
        return String(fl.lineNumberFormatter(fm + fl.firstLineNumber))
    }

    function dh(fl) {
        return fl.scroller.getBoundingClientRect().left - fl.sizer.getBoundingClientRect().left
    }

    function c6(fq, ft, fu) {
        var fs = fq.display.viewFrom,
            fr = fq.display.viewTo,
            fo;
        var fl = bG(fq.display, fq.doc, ft);
        for (var fn = true;; fn = false) {
            var fm = fq.display.scroller.clientWidth;
            if (!cK(fq, fl, fu)) {
                break
            }
            fo = true;
            var fp = cY(fq);
            bf(fq);
            ef(fq, fp);
            if (fn && fq.options.lineWrapping && fm != fq.display.scroller.clientWidth) {
                fu = true;
                continue
            }
            fu = false;
            if (ft && ft.top != null) {
                ft = {
                    top: Math.min(fp.scrollHeight - fp.clientHeight, ft.top)
                }
            }
            fl = bG(fq.display, fq.doc, ft);
            if (fl.from >= fq.display.viewFrom && fl.to <= fq.display.viewTo) {
                break
            }
        }
        fq.display.updateLineNumbers = null;
        if (fo) {
            T(fq, "update", fq);
            if (fq.display.viewFrom != fs || fq.display.viewTo != fr) {
                T(fq, "viewportChange", fq, fq.display.viewFrom, fq.display.viewTo)
            }
        }
        return fo
    }

    function cK(fv, fn, fw) {
        var fp = fv.display,
            fu = fv.doc;
        if (!fp.wrapper.offsetWidth) {
            dP(fv);
            return
        }
        if (!fw && fn.from >= fp.viewFrom && fn.to <= fp.viewTo && cG(fv) == 0) {
            return
        }
        if (dp(fv)) {
            dP(fv)
        }
        var ft = ep(fv);
        var fo = fu.first + fu.size;
        var fs = Math.max(fn.from - fv.options.viewportMargin, fu.first);
        var fr = Math.min(fo, fn.to + fv.options.viewportMargin);
        if (fp.viewFrom < fs && fs - fp.viewFrom < 20) {
            fs = Math.max(fu.first, fp.viewFrom)
        }
        if (fp.viewTo > fr && fp.viewTo - fr < 20) {
            fr = Math.min(fo, fp.viewTo)
        }
        if (aN) {
            fs = aB(fv.doc, fs);
            fr = dm(fv.doc, fr)
        }
        var fm = fs != fp.viewFrom || fr != fp.viewTo || fp.lastSizeC != fp.wrapper.clientHeight;
        cq(fv, fs, fr);
        fp.viewOffset = bo(es(fv.doc, fp.viewFrom));
        fv.display.mover.style.top = fp.viewOffset + "px";
        var fl = cG(fv);
        if (!fm && fl == 0 && !fw) {
            return
        }
        if (fl > 4) {
            var fq = c9();
            fp.lineDiv.style.display = "none"
        }
        bY(fv, fp.updateLineNumbers, ft);
        if (fl > 4) {
            fp.lineDiv.style.display = "";
            if (fq && c9() != fq && fq.offsetHeight) {
                fq.focus()
            }
        }
        fp.gutters.style.height = "";
        dk(fp.cursorDiv);
        dk(fp.selectionDiv);
        if (fm) {
            fp.lastSizeC = fp.wrapper.clientHeight;
            dy(fv, 400)
        }
        aP(fv);
        return true
    }

    function aP(fs) {
        var fq = fs.display;
        var fm = fq.lineDiv.offsetTop;
        for (var fn = 0; fn < fq.view.length; fn++) {
            var ft = fq.view[fn],
                fu;
            if (ft.hidden) {
                continue
            }
            if (bN) {
                var fp = ft.node.offsetTop + ft.node.offsetHeight;
                fu = fp - fm;
                fm = fp
            } else {
                var fo = ft.node.getBoundingClientRect();
                fu = fo.bottom - fo.top
            }
            var fr = ft.line.height - fu;
            if (fu < 2) {
                fu = aD(fq)
            }
            if (fr > 0.001 || fr < -0.001) {
                e9(ft.line, fu);
                bM(ft.line);
                if (ft.rest) {
                    for (var fl = 0; fl < ft.rest.length; fl++) {
                        bM(ft.rest[fl])
                    }
                }
            }
        }
    }

    function bM(fl) {
        if (fl.widgets) {
            for (var fm = 0; fm < fl.widgets.length;
                ++fm) {
                fl.widgets[fm].height = fl.widgets[fm].node.offsetHeight
            }
        }
    }

    function ep(fl) {
        var fp = fl.display,
            fo = {},
            fn = {};
        for (var fq = fp.gutters.firstChild, fm = 0; fq; fq = fq.nextSibling, ++fm) {
            fo[fl.options.gutters[fm]] = fq.offsetLeft;
            fn[fl.options.gutters[fm]] = fq.offsetWidth
        }
        return {
            fixedPos: dh(fp),
            gutterTotalWidth: fp.gutters.offsetWidth,
            gutterLeft: fo,
            gutterWidth: fn,
            wrapperWidth: fp.wrapper.clientWidth
        }
    }

    function bY(fw, fn, fv) {
        var fs = fw.display,
            fy = fw.options.lineNumbers;
        var fl = fs.lineDiv,
            fx = fl.firstChild;

        function fr(fA) {
            var fz = fA.nextSibling;
            if (cv && bH && fw.display.currentWheelTarget == fA) {
                fA.style.display = "none"
            } else {
                fA.parentNode.removeChild(fA)
            }
            return fz
        }
        var ft = fs.view,
            fq = fs.viewFrom;
        for (var fo = 0; fo < ft.length; fo++) {
            var fp = ft[fo];
            if (fp.hidden) {} else {
                if (!fp.node) {
                    var fm = ap(fw, fp, fq, fv);
                    fl.insertBefore(fm, fx)
                } else {
                    while (fx != fp.node) {
                        fx = fr(fx)
                    }
                    var fu = fy && fn != null && fn <= fq && fp.lineNumber;
                    if (fp.changes) {
                        if (cM(fp.changes, "gutter") > -1) {
                            fu = false
                        }
                        Q(fw, fp, fq, fv)
                    }
                    if (fu) {
                        dk(fp.lineNumber);
                        fp.lineNumber.appendChild(document.createTextNode(dK(fw.options, fq)))
                    }
                    fx = fp.node.nextSibling
                }
            }
            fq += fp.size
        }
        while (fx) {
            fx = fr(fx)
        }
    }

    function Q(fl, fn, fp, fq) {
        for (var fm = 0; fm < fn.changes.length; fm++) {
            var fo = fn.changes[fm];
            if (fo == "text") {
                ey(fl, fn)
            } else {
                if (fo == "gutter") {
                    cJ(fl, fn, fp, fq)
                } else {
                    if (fo == "class") {
                        c3(fn)
                    } else {
                        if (fo == "widget") {
                            ad(fn, fq)
                        }
                    }
                }
            }
        }
        fn.changes = null
    }

    function eS(fl) {
        if (fl.node == fl.text) {
            fl.node = e5("div", null, null, "position: relative");
            if (fl.text.parentNode) {
                fl.text.parentNode.replaceChild(fl.node, fl.text)
            }
            fl.node.appendChild(fl.text);
            if (bN) {
                fl.node.style.zIndex = 2
            }
        }
        return fl.node
    }

    function dM(fm) {
        var fl = fm.bgClass ? fm.bgClass + " " + (fm.line.bgClass || "") : fm.line.bgClass;
        if (fl) {
            fl += " CodeMirror-linebackground"
        }
        if (fm.background) {
            if (fl) {
                fm.background.className = fl
            } else {
                fm.background.parentNode.removeChild(fm.background);
                fm.background = null
            }
        } else {
            if (fl) {
                var fn = eS(fm);
                fm.background = fn.insertBefore(e5("div", null, fl), fn.firstChild)
            }
        }
    }

    function df(fl, fm) {
        var fn = fl.display.externalMeasured;
        if (fn && fn.line == fm.line) {
            fl.display.externalMeasured = null;
            fm.measure = fn.measure;
            return fn.built
        }
        return d9(fl, fm)
    }

    function ey(fl, fo) {
        var fm = fo.text.className;
        var fn = df(fl, fo);
        if (fo.text == fo.node) {
            fo.node = fn.pre
        }
        fo.text.parentNode.replaceChild(fn.pre, fo.text);
        fo.text = fn.pre;
        if (fn.bgClass != fo.bgClass || fn.textClass != fo.textClass) {
            fo.bgClass = fn.bgClass;
            fo.textClass = fn.textClass;
            c3(fo)
        } else {
            if (fm) {
                fo.text.className = fm
            }
        }
    }

    function c3(fm) {
        dM(fm);
        if (fm.line.wrapClass) {
            eS(fm).className = fm.line.wrapClass
        } else {
            if (fm.node != fm.text) {
                fm.node.className = ""
            }
        }
        var fl = fm.textClass ? fm.textClass + " " + (fm.line.textClass || "") : fm.line.textClass;
        fm.text.className = fl || ""
    }

    function cJ(ft, fr, fq, fs) {
        if (fr.gutter) {
            fr.node.removeChild(fr.gutter);
            fr.gutter = null
        }
        var fo = fr.line.gutterMarkers;
        if (ft.options.lineNumbers || fo) {
            var fm = eS(fr);
            var fp = fr.gutter = fm.insertBefore(e5("div", null, "CodeMirror-gutter-wrapper", "position: absolute; left: " + (ft.options.fixedGutter ? fs.fixedPos : -fs.gutterTotalWidth) + "px"), fr.text);
            if (ft.options.lineNumbers && (!fo || !fo["CodeMirror-linenumbers"])) {
                fr.lineNumber = fp.appendChild(e5("div", dK(ft.options, fq), "CodeMirror-linenumber CodeMirror-gutter-elt", "left: " + fs.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + ft.display.lineNumInnerWidth + "px"))
            }
            if (fo) {
                for (var fn = 0; fn < ft.options.gutters.length;
                    ++fn) {
                    var fl = ft.options.gutters[fn],
                        fu = fo.hasOwnProperty(fl) && fo[fl];
                    if (fu) {
                        fp.appendChild(e5("div", [fu], "CodeMirror-gutter-elt", "left: " + fs.gutterLeft[fl] + "px; width: " + fs.gutterWidth[fl] + "px"))
                    }
                }
            }
        }
    }

    function ad(fl, fo) {
        if (fl.alignable) {
            fl.alignable = null
        }
        for (var fn = fl.node.firstChild, fm; fn; fn = fm) {
            var fm = fn.nextSibling;
            if (fn.className == "CodeMirror-linewidget") {
                fl.node.removeChild(fn)
            }
        }
        eG(fl, fo)
    }

    function ap(fl, fn, fo, fp) {
        var fm = df(fl, fn);
        fn.text = fn.node = fm.pre;
        if (fm.bgClass) {
            fn.bgClass = fm.bgClass
        }
        if (fm.textClass) {
            fn.textClass = fm.textClass
        }
        c3(fn);
        cJ(fl, fn, fo, fp);
        eG(fn, fp);
        return fn.node
    }

    function eG(fm, fn) {
        fa(fm.line, fm, fn, true);
        if (fm.rest) {
            for (var fl = 0; fl < fm.rest.length; fl++) {
                fa(fm.rest[fl], fm, fn, false)
            }
        }
    }

    function fa(ft, fq, fs, fo) {
        if (!ft.widgets) {
            return
        }
        var fl = eS(fq);
        for (var fn = 0, fr = ft.widgets; fn < fr.length;
            ++fn) {
            var fp = fr[fn],
                fm = e5("div", [fp.node], "CodeMirror-linewidget");
            if (!fp.handleMouseEvents) {
                fm.ignoreEvents = true
            }
            bh(fp, fm, fq, fs);
            if (fo && fp.above) {
                fl.insertBefore(fm, fq.gutter || fq.text)
            } else {
                fl.appendChild(fm)
            }
            T(fp, "redraw")
        }
    }

    function bh(fo, fn, fl, fp) {
        if (fo.noHScroll) {
            (fl.alignable || (fl.alignable = [])).push(fn);
            var fm = fp.wrapperWidth;
            fn.style.left = fp.fixedPos + "px";
            if (!fo.coverGutter) {
                fm -= fp.gutterTotalWidth;
                fn.style.paddingLeft = fp.gutterTotalWidth + "px"
            }
            fn.style.width = fm + "px"
        }
        if (fo.coverGutter) {
            fn.style.zIndex = 5;
            fn.style.position = "relative";
            if (!fo.noHScroll) {
                fn.style.marginLeft = -fp.gutterTotalWidth + "px"
            }
        }
    }
    var O = C.Pos = function(fl, fm) {
        if (!(this instanceof O)) {
            return new O(fl, fm)
        }
        this.line = fl;
        this.ch = fm
    };
    var bR = C.cmpPos = function(fm, fl) {
        return fm.line - fl.line || fm.ch - fl.ch
    };

    function bV(fl) {
        return O(fl.line, fl.ch)
    }

    function bc(fm, fl) {
        return bR(fm, fl) < 0 ? fl : fm
    }

    function ae(fm, fl) {
        return bR(fm, fl) < 0 ? fm : fl
    }

    function e6(fl, fm) {
        this.ranges = fl;
        this.primIndex = fm
    }
    e6.prototype = {
        primary: function() {
            return this.ranges[this.primIndex]
        },
        equals: function(fl) {
            if (fl == this) {
                return true
            }
            if (fl.primIndex != this.primIndex || fl.ranges.length != this.ranges.length) {
                return false
            }
            for (var fn = 0; fn < this.ranges.length; fn++) {
                var fm = this.ranges[fn],
                    fo = fl.ranges[fn];
                if (bR(fm.anchor, fo.anchor) != 0 || bR(fm.head, fo.head) != 0) {
                    return false
                }
            }
            return true
        },
        deepCopy: function() {
            for (var fl = [], fm = 0; fm < this.ranges.length; fm++) {
                fl[fm] = new di(bV(this.ranges[fm].anchor), bV(this.ranges[fm].head))
            }
            return new e6(fl, this.primIndex)
        },
        somethingSelected: function() {
            for (var fl = 0; fl < this.ranges.length; fl++) {
                if (!this.ranges[fl].empty()) {
                    return true
                }
            }
            return false
        },
        contains: function(fo, fl) {
            if (!fl) {
                fl = fo
            }
            for (var fn = 0; fn < this.ranges.length; fn++) {
                var fm = this.ranges[fn];
                if (bR(fl, fm.from()) >= 0 && bR(fo, fm.to()) <= 0) {
                    return fn
                }
            }
            return -1
        }
    };

    function di(fl, fm) {
        this.anchor = fl;
        this.head = fm
    }
    di.prototype = {
        from: function() {
            return ae(this.anchor, this.head)
        },
        to: function() {
            return bc(this.anchor, this.head)
        },
        empty: function() {
            return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch
        }
    };

    function b8(fl, fs) {
        var fn = fl[fs];
        fl.sort(function(fv, fu) {
            return bR(fv.from(), fu.from())
        });
        fs = cM(fl, fn);
        for (var fp = 1; fp < fl.length; fp++) {
            var ft = fl[fp],
                fm = fl[fp - 1];
            if (bR(fm.to(), ft.from()) >= 0) {
                var fq = ae(fm.from(), ft.from()),
                    fr = bc(fm.to(), ft.to());
                var fo = fq == fm.head || fq == ft.head;
                if (fp <= fs) {
                    --fs
                }
                fl.splice(fp-- -1, 2, new di(fo ? fr : fq, fo ? fq : fr))
            }
        }
        return new e6(fl, fs)
    }

    function d8(fl, fm) {
        return new e6([new di(fl, fm || fl)], 0)
    }

    function cA(fl, fm) {
        return Math.max(fl.first, Math.min(fm, fl.first + fl.size - 1))
    }

    function eT(fm, fn) {
        if (fn.line < fm.first) {
            return O(fm.first, 0)
        }
        var fl = fm.first + fm.size - 1;
        if (fn.line > fl) {
            return O(fl, es(fm, fl).text.length)
        }
        return eF(fn, es(fm, fn.line).text.length)
    }

    function eF(fn, fm) {
        var fl = fn.ch;
        if (fl == null || fl > fm) {
            return O(fn.line, fm)
        } else {
            if (fl < 0) {
                return O(fn.line, 0)
            } else {
                return fn
            }
        }
    }

    function bJ(fm, fl) {
        return fl >= fm.first && fl < fm.first + fm.size
    }

    function dj(fn, fo) {
        for (var fl = [], fm = 0; fm < fo.length; fm++) {
            fl[fm] = eT(fn, fo[fm])
        }
        return fl
    }

    function eI(fq, fm, fp, fl) {
        if (fq.cm && fq.cm.display.shift || fq.extend) {
            var fo = fm.anchor;
            if (fl) {
                var fn = bR(fp, fo) < 0;
                if (fn != (bR(fl, fo) < 0)) {
                    fo = fp;
                    fp = fl
                } else {
                    if (fn != (bR(fp, fl) < 0)) {
                        fp = fl
                    }
                }
            }
            return new di(fo, fp)
        } else {
            return new di(fl || fp, fp)
        }
    }

    function e2(fo, fn, fm, fl) {
        bw(fo, new e6([eI(fo, fo.sel.primary(), fn, fm)], 0), fl)
    }

    function aj(fq, fp, fl) {
        for (var fn = [], fo = 0; fo < fq.sel.ranges.length; fo++) {
            fn[fo] = eI(fq, fq.sel.ranges[fo], fp[fo], null)
        }
        var fm = b8(fn, fq.sel.primIndex);
        bw(fq, fm, fl)
    }

    function e(fo, fn, fm) {
        var fl = fo.sel.ranges.slice(0);
        fl[fn] = fm;
        bw(fo, b8(fl, fo.sel.primIndex))
    }

    function A(fo, fm, fn, fl) {
        bw(fo, d8(fm, fn), fl)
    }

    function c(fn, fl) {
        var fm = {
            ranges: fl.ranges,
            update: function(fo) {
                this.ranges = [];
                for (var fp = 0; fp < fo.length; fp++) {
                    this.ranges[fp] = new di(eT(fn, fo[fp].anchor), eT(fn, fo[fp].head))
                }
            }
        };
        ao(fn, "beforeSelectionChange", fn, fm);
        if (fn.cm) {
            ao(fn.cm, "beforeSelectionChange", fn.cm, fm)
        }
        if (fm.ranges != fl.ranges) {
            return b8(fm.ranges, fm.ranges.length - 1)
        } else {
            return fl
        }
    }

    function ek(fp, fo, fl) {
        var fm = fp.history.done,
            fn = eR(fm);
        if (fn && fn.ranges) {
            fm[fm.length - 1] = fo;
            dH(fp, fo, fl)
        } else {
            bw(fp, fo, fl)
        }
    }

    function bw(fn, fm, fl) {
        dH(fn, fm, fl);
        fe(fn, fn.sel, fn.cm ? fn.cm.curOp.id : NaN)
    }

    function dH(fo, fn, fl) {
        if (ev(fo, "beforeSelectionChange") || fo.cm && ev(fo.cm, "beforeSelectionChange")) {
            fn = c(fo, fn)
        }
        var fm = bR(fn.primary().head, fo.sel.primary().head) < 0 ? -1 : 1;
        cE(fo, k(fo, fn, fm, true));
        if (fl !== false && fo.cm) {
            eQ(fo.cm)
        }
    }

    function cE(fm, fl) {
        if (fl.equals(fm.sel)) {
            return
        }
        fm.sel = fl;
        if (fm.cm) {
            fm.cm.curOp.updateInput = fm.cm.curOp.selectionChanged = fm.cm.curOp.cursorActivity = true
        }
        T(fm, "cursorActivity", fm)
    }

    function dQ(fl) {
        cE(fl, k(fl, fl.sel, null, false), false)
    }

    function k(ft, fl, fq, fr) {
        var fn;
        for (var fo = 0; fo < fl.ranges.length; fo++) {
            var fp = fl.ranges[fo];
            var fs = bx(ft, fp.anchor, fq, fr);
            var fm = bx(ft, fp.head, fq, fr);
            if (fn || fs != fp.anchor || fm != fp.head) {
                if (!fn) {
                    fn = fl.ranges.slice(0, fo)
                }
                fn[fo] = new di(fs, fm)
            }
        }
        return fn ? b8(fn, fl.primIndex) : fl
    }

    function bx(fu, ft, fq, fr) {
        var fv = false,
            fn = ft;
        var fo = fq || 1;
        fu.cantEdit = false;
        search: for (;;) {
            var fw = es(fu, fn.line);
            if (fw.markedSpans) {
                for (var fp = 0; fp < fw.markedSpans.length;
                    ++fp) {
                    var fl = fw.markedSpans[fp],
                        fm = fl.marker;
                    if ((fl.from == null || (fm.inclusiveLeft ? fl.from <= fn.ch : fl.from < fn.ch)) && (fl.to == null || (fm.inclusiveRight ? fl.to >= fn.ch : fl.to > fn.ch))) {
                        if (fr) {
                            ao(fm, "beforeCursorEnter");
                            if (fm.explicitlyCleared) {
                                if (!fw.markedSpans) {
                                    break
                                } else {
                                    --fp;
                                    continue
                                }
                            }
                        }
                        if (!fm.atomic) {
                            continue
                        }
                        var fs = fm.find(fo < 0 ? -1 : 1);
                        if (bR(fs, fn) == 0) {
                            fs.ch += fo;
                            if (fs.ch < 0) {
                                if (fs.line > fu.first) {
                                    fs = eT(fu, O(fs.line - 1))
                                } else {
                                    fs = null
                                }
                            } else {
                                if (fs.ch > fw.text.length) {
                                    if (fs.line < fu.first + fu.size - 1) {
                                        fs = O(fs.line + 1, 0)
                                    } else {
                                        fs = null
                                    }
                                }
                            }
                            if (!fs) {
                                if (fv) {
                                    if (!fr) {
                                        return bx(fu, ft, fq, true)
                                    }
                                    fu.cantEdit = true;
                                    return O(fu.first, 0)
                                }
                                fv = true;
                                fs = ft;
                                fo = -fo
                            }
                        }
                        fn = fs;
                        continue search
                    }
                }
            }
            return fn
        }
    }

    function bf(fx) {
        var fs = fx.display,
            fw = fx.doc;
        var fu = document.createDocumentFragment();
        var fo = document.createDocumentFragment();
        for (var fq = 0; fq < fw.sel.ranges.length; fq++) {
            var fr = fw.sel.ranges[fq];
            var fp = fr.empty();
            if (fp || fx.options.showCursorWhenSelecting) {
                E(fx, fr, fu)
            }
            if (!fp) {
                aa(fx, fr, fo)
            }
        }
        if (fx.options.moveInputWithCursor) {
            var ft = de(fx, fw.sel.primary().head, "div");
            var fl = fs.wrapper.getBoundingClientRect(),
                fn = fs.lineDiv.getBoundingClientRect();
            var fv = Math.max(0, Math.min(fs.wrapper.clientHeight - 10, ft.top + fn.top - fl.top));
            var fm = Math.max(0, Math.min(fs.wrapper.clientWidth - 10, ft.left + fn.left - fl.left));
            fs.inputDiv.style.top = fv + "px";
            fs.inputDiv.style.left = fm + "px"
        }
        bt(fs.cursorDiv, fu);
        bt(fs.selectionDiv, fo)
    }

    function E(fl, fo, fn) {
        var fq = de(fl, fo.head, "div");
        var fp = fn.appendChild(e5("div", "\u00a0", "CodeMirror-cursor"));
        fp.style.left = fq.left + "px";
        fp.style.top = fq.top + "px";
        fp.style.height = Math.max(0, fq.bottom - fq.top) * fl.options.cursorHeight + "px";
        if (fq.other) {
            var fm = fn.appendChild(e5("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
            fm.style.display = "";
            fm.style.left = fq.other.left + "px";
            fm.style.top = fq.other.top + "px";
            fm.style.height = (fq.other.bottom - fq.other.top) * 0.85 + "px"
        }
    }

    function aa(fy, fq, fm) {
        var ft = fy.display,
            fx = fy.doc;
        var fr = document.createDocumentFragment();
        var fw = ft.lineSpace.offsetWidth,
            fo = aC(fy.display);

        function fB(fF, fE, fD, fC) {
            if (fE < 0) {
                fE = 0
            }
            fr.appendChild(e5("div", null, "CodeMirror-selected", "position: absolute; left: " + fF + "px; top: " + fE + "px; width: " + (fD == null ? fw - fF : fD) + "px; height: " + (fC - fE) + "px"))
        }

        function fv(fD, fF, fI) {
            var fE = es(fx, fD);
            var fG = fE.text.length;
            var fJ, fC;

            function fH(fL, fK) {
                return cj(fy, O(fD, fL), "div", fE, fK)
            }
            dn(a(fE), fF || 0, fI == null ? fG : fI, function(fR, fQ, fK) {
                var fN = fH(fR, "left"),
                    fO, fP, fM;
                if (fR == fQ) {
                    fO = fN;
                    fP = fM = fN.left
                } else {
                    fO = fH(fQ - 1, "right");
                    if (fK == "rtl") {
                        var fL = fN;
                        fN = fO;
                        fO = fL
                    }
                    fP = fN.left;
                    fM = fO.right
                }
                if (fF == null && fR == 0) {
                    fP = fo
                }
                if (fO.top - fN.top > 3) {
                    fB(fP, fN.top, null, fN.bottom);
                    fP = fo;
                    if (fN.bottom < fO.top) {
                        fB(fP, fN.bottom, null, fO.top)
                    }
                }
                if (fI == null && fQ == fG) {
                    fM = fw
                }
                if (!fJ || fN.top < fJ.top || fN.top == fJ.top && fN.left < fJ.left) {
                    fJ = fN
                }
                if (!fC || fO.bottom > fC.bottom || fO.bottom == fC.bottom && fO.right > fC.right) {
                    fC = fO
                }
                if (fP < fo + 1) {
                    fP = fo
                }
                fB(fP, fO.top, fM - fP, fO.bottom)
            });
            return {
                start: fJ,
                end: fC
            }
        }
        var fl = fq.from(),
            fA = fq.to();
        if (fl.line == fA.line) {
            fv(fl.line, fl.ch, fA.ch)
        } else {
            var fp = es(fx, fl.line),
                fn = es(fx, fA.line);
            var fs = u(fp) == u(fn);
            var fz = fv(fl.line, fl.ch, fs ? fp.text.length : null).end;
            var fu = fv(fA.line, fs ? 0 : null, fA.ch).start;
            if (fs) {
                if (fz.top < fu.top - 2) {
                    fB(fz.right, fz.top, null, fz.bottom);
                    fB(fo, fu.top, fu.left, fu.bottom)
                } else {
                    fB(fz.right, fz.top, fu.left - fz.right, fz.bottom)
                }
            }
            if (fz.bottom < fu.top) {
                fB(fo, fz.bottom, null, fu.top)
            }
        }
        fm.appendChild(fr)
    }

    function l(fl) {
        if (!fl.state.focused) {
            return
        }
        var fn = fl.display;
        clearInterval(fn.blinker);
        var fm = true;
        fn.cursorDiv.style.visibility = "";
        if (fl.options.cursorBlinkRate > 0) {
            fn.blinker = setInterval(function() {
                fn.cursorDiv.style.visibility = (fm = !fm) ? "" : "hidden"
            }, fl.options.cursorBlinkRate)
        }
    }

    function dy(fl, fm) {
        if (fl.doc.mode.startState && fl.doc.frontier < fl.display.viewTo) {
            fl.state.highlight.set(fm, b7(cp, fl))
        }
    }

    function cp(fl) {
        var fo = fl.doc;
        if (fo.frontier < fo.first) {
            fo.frontier = fo.first
        }
        if (fo.frontier >= fl.display.viewTo) {
            return
        }
        var fm = +new Date + fl.options.workTime;
        var fn = bE(fo.mode, cZ(fl, fo.frontier));
        cm(fl, function() {
            fo.iter(fo.frontier, Math.min(fo.first + fo.size, fl.display.viewTo + 500), function(fp) {
                if (fo.frontier >= fl.display.viewFrom) {
                    var fr = fp.styles;
                    fp.styles = eM(fl, fp, fn, true);
                    var fs = !fr || fr.length != fp.styles.length;
                    for (var fq = 0; !fs && fq < fr.length;
                        ++fq) {
                        fs = fr[fq] != fp.styles[fq]
                    }
                    if (fs) {
                        L(fl, fo.frontier, "text")
                    }
                    fp.stateAfter = bE(fo.mode, fn)
                } else {
                    cW(fl, fp.text, fn);
                    fp.stateAfter = fo.frontier % 5 == 0 ? bE(fo.mode, fn) : null
                }++fo.frontier;
                if (+new Date > fm) {
                    dy(fl, fl.options.workDelay);
                    return true
                }
            })
        })
    }

    function ca(fr, fl, fo) {
        var fm, fp, fq = fr.doc;
        var fn = fo ? -1 : fl - (fr.doc.mode.innerMode ? 1000 : 100);
        for (var fu = fl; fu > fn;
            --fu) {
            if (fu <= fq.first) {
                return fq.first
            }
            var ft = es(fq, fu - 1);
            if (ft.stateAfter && (!fo || fu <= fq.frontier)) {
                return fu
            }
            var fs = bv(ft.text, null, fr.options.tabSize);
            if (fp == null || fm > fs) {
                fp = fu - 1;
                fm = fs
            }
        }
        return fp
    }

    function cZ(fl, fr, fm) {
        var fp = fl.doc,
            fo = fl.display;
        if (!fp.mode.startState) {
            return true
        }
        var fq = ca(fl, fr, fm),
            fn = fq > fp.first && es(fp, fq - 1).stateAfter;
        if (!fn) {
            fn = bC(fp.mode)
        } else {
            fn = bE(fp.mode, fn)
        }
        fp.iter(fq, fr, function(fs) {
            cW(fl, fs.text, fn);
            var ft = fq == fr - 1 || fq % 5 == 0 || fq >= fo.viewFrom && fq < fo.viewTo;
            fs.stateAfter = ft ? bE(fp.mode, fn) : null;
            ++fq
        });
        if (fm) {
            fp.frontier = fq
        }
        return fn
    }

    function el(fl) {
        return fl.lineSpace.offsetTop
    }

    function bk(fl) {
        return fl.mover.offsetHeight - fl.lineSpace.offsetHeight
    }

    function aC(fm) {
        var fl = bt(fm.measure, e5("pre", null, null, "text-align: left")).appendChild(e5("span", "x"));
        return fl.offsetLeft
    }

    function bU(fs, fo, fr) {
        var fn = fs.options.lineWrapping;
        var fp = fn && fs.display.scroller.clientWidth;
        if (!fo.measure.heights || fn && fo.measure.width != fp) {
            var fq = fo.measure.heights = [];
            if (fn) {
                fo.measure.width = fp;
                var fu = fo.text.firstChild.getClientRects();
                for (var fl = 0; fl < fu.length - 1; fl++) {
                    var ft = fu[fl],
                        fm = fu[fl + 1];
                    if (Math.abs(ft.bottom - fm.bottom) > 2) {
                        fq.push((ft.bottom + fm.top) / 2 - fr.top)
                    }
                }
            }
            fq.push(fr.bottom - fr.top)
        }
    }

    function b5(fn, fl, fo) {
        if (fn.line == fl) {
            return {
                map: fn.measure.map,
                cache: fn.measure.cache
            }
        }
        for (var fm = 0; fm < fn.rest.length; fm++) {
            if (fn.rest[fm] == fl) {
                return {
                    map: fn.measure.maps[fm],
                    cache: fn.measure.caches[fm]
                }
            }
        }
        for (var fm = 0; fm < fn.rest.length; fm++) {
            if (bp(fn.rest[fm]) > fo) {
                return {
                    map: fn.measure.maps[fm],
                    cache: fn.measure.caches[fm],
                    before: true
                }
            }
        }
    }

    function cw(fl, fn) {
        fn = u(fn);
        var fp = bp(fn);
        var fm = fl.display.externalMeasured = new ba(fl.doc, fn, fp);
        fm.lineN = fp;
        var fo = fm.built = d9(fl, fm);
        fm.text = fo.pre;
        bt(fl.display.lineMeasure, fo.pre);
        return fm
    }

    function dA(fl, fm, fo, fn) {
        return x(fl, aK(fl, fm), fo, fn)
    }

    function eo(fl, fn) {
        if (fn >= fl.display.viewFrom && fn < fl.display.viewTo) {
            return fl.display.view[cR(fl, fn)]
        }
        var fm = fl.display.externalMeasured;
        if (fm && fn >= fm.lineN && fn < fm.lineN + fm.size) {
            return fm
        }
    }

    function aK(fl, fn) {
        var fo = bp(fn);
        var fm = eo(fl, fo);
        if (fm && !fm.text) {
            fm = null
        } else {
            if (fm && fm.changes) {
                Q(fl, fm, fo, ep(fl))
            }
        }
        if (!fm) {
            fm = cw(fl, fn)
        }
        var fp = b5(fm, fn, fo);
        return {
            line: fn,
            view: fm,
            rect: null,
            map: fp.map,
            cache: fp.cache,
            before: fp.before,
            hasHeights: false
        }
    }

    function x(fl, fq, fo, fm) {
        if (fq.before) {
            fo = -1
        }
        var fn = fo + (fm || ""),
            fp;
        if (fq.cache.hasOwnProperty(fn)) {
            fp = fq.cache[fn]
        } else {
            if (!fq.rect) {
                fq.rect = fq.view.text.getBoundingClientRect()
            }
            if (!fq.hasHeights) {
                bU(fl, fq.view, fq.rect);
                fq.hasHeights = true
            }
            fp = h(fl, fq, fo, fm);
            if (!fp.bogus) {
                fq.cache[fn] = fp
            }
        }
        return {
            left: fp.left,
            right: fp.right,
            top: fp.top,
            bottom: fp.bottom
        }
    }
    var dU = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };

    function h(fs, fA, fu, fq) {
        var fD = fA.map;
        var fx, fp, fo, fl;
        for (var fz = 0; fz < fD.length; fz += 3) {
            var fC = fD[fz],
                fy = fD[fz + 1];
            if (fu < fC) {
                fp = 0;
                fo = 1;
                fl = "left"
            } else {
                if (fu < fy) {
                    fp = fu - fC;
                    fo = fp + 1
                } else {
                    if (fz == fD.length - 3 || fu == fy && fD[fz + 3] > fu) {
                        fo = fy - fC;
                        fp = fo - 1;
                        if (fu >= fy) {
                            fl = "right"
                        }
                    }
                }
            }
            if (fp != null) {
                fx = fD[fz + 2];
                if (fC == fy && fq == (fx.insertLeft ? "left" : "right")) {
                    fl = fq
                }
                if (fq == "left" && fp == 0) {
                    while (fz && fD[fz - 2] == fD[fz - 3] && fD[fz - 1].insertLeft) {
                        fx = fD[(fz -= 3) + 2];
                        fl = "left"
                    }
                }
                if (fq == "right" && fp == fy - fC) {
                    while (fz < fD.length - 3 && fD[fz + 3] == fD[fz + 4] && !fD[fz + 5].insertLeft) {
                        fx = fD[(fz += 3) + 2];
                        fl = "right"
                    }
                }
                break
            }
        }
        var fm;
        if (fx.nodeType == 3) {
            while (fp && eD(fA.line.text.charAt(fC + fp))) {
                --fp
            }
            while (fC + fo < fy && eD(fA.line.text.charAt(fC + fo))) {
                ++fo
            }
            if (bK && fp == 0 && fo == fy - fC) {
                fm = fx.parentNode.getBoundingClientRect()
            } else {
                if (c5 && fs.options.lineWrapping) {
                    var fn = bX(fx, fp, fo).getClientRects();
                    if (fn.length) {
                        fm = fn[fq == "right" ? fn.length - 1 : 0]
                    } else {
                        fm = dU
                    }
                } else {
                    fm = bX(fx, fp, fo).getBoundingClientRect() || dU
                }
            }
        } else {
            if (fp > 0) {
                fl = fq = "right"
            }
            var fn;
            if (fs.options.lineWrapping && (fn = fx.getClientRects()).length > 1) {
                fm = fn[fq == "right" ? fn.length - 1 : 0]
            } else {
                fm = fx.getBoundingClientRect()
            }
        }
        if (bK && !fp && (!fm || !fm.left && !fm.right)) {
            var fr = fx.parentNode.getClientRects()[0];
            if (fr) {
                fm = {
                    left: fr.left,
                    right: fr.left + c1(fs.display),
                    top: fr.top,
                    bottom: fr.bottom
                }
            } else {
                fm = dU
            }
        }
        var fw, fv = (fm.bottom + fm.top) / 2 - fA.rect.top;
        var fB = fA.view.measure.heights;
        for (var fz = 0; fz < fB.length - 1; fz++) {
            if (fv < fB[fz]) {
                break
            }
        }
        fw = fz ? fB[fz - 1] : 0;
        fv = fB[fz];
        var ft = {
            left: (fl == "right" ? fm.right : fm.left) - fA.rect.left,
            right: (fl == "left" ? fm.left : fm.right) - fA.rect.left,
            top: fw,
            bottom: fv
        };
        if (!fm.left && !fm.right) {
            ft.bogus = true
        }
        return ft
    }

    function ag(fm) {
        if (fm.measure) {
            fm.measure.cache = {};
            fm.measure.heights = null;
            if (fm.rest) {
                for (var fl = 0; fl < fm.rest.length; fl++) {
                    fm.measure.caches[fl] = {}
                }
            }
        }
    }

    function av(fl) {
        fl.display.externalMeasure = null;
        dk(fl.display.lineMeasure);
        for (var fm = 0; fm < fl.display.view.length; fm++) {
            ag(fl.display.view[fm])
        }
    }

    function Z(fl) {
        av(fl);
        fl.display.cachedCharWidth = fl.display.cachedTextHeight = null;
        if (!fl.options.lineWrapping) {
            fl.display.maxLineChanged = true
        }
        fl.display.lineNumChars = null
    }

    function b6() {
        return window.pageXOffset || (document.documentElement || document.body).scrollLeft
    }

    function b4() {
        return window.pageYOffset || (document.documentElement || document.body).scrollTop
    }

    function d7(fr, fo, fq, fm) {
        if (fo.widgets) {
            for (var fn = 0; fn < fo.widgets.length;
                ++fn) {
                if (fo.widgets[fn].above) {
                    var ft = ct(fo.widgets[fn]);
                    fq.top += ft;
                    fq.bottom += ft
                }
            }
        }
        if (fm == "line") {
            return fq
        }
        if (!fm) {
            fm = "local"
        }
        var fp = bo(fo);
        if (fm == "local") {
            fp += el(fr.display)
        } else {
            fp -= fr.display.viewOffset
        }
        if (fm == "page" || fm == "window") {
            var fl = fr.display.lineSpace.getBoundingClientRect();
            fp += fl.top + (fm == "window" ? 0 : b4());
            var fs = fl.left + (fm == "window" ? 0 : b6());
            fq.left += fs;
            fq.right += fs
        }
        fq.top += fp;
        fq.bottom += fp;
        return fq
    }

    function fh(fm, fp, fn) {
        if (fn == "div") {
            return fp
        }
        var fr = fp.left,
            fq = fp.top;
        if (fn == "page") {
            fr -= b6();
            fq -= b4()
        } else {
            if (fn == "local" || !fn) {
                var fo = fm.display.sizer.getBoundingClientRect();
                fr += fo.left;
                fq += fo.top
            }
        }
        var fl = fm.display.lineSpace.getBoundingClientRect();
        return {
            left: fr - fl.left,
            top: fq - fl.top
        }
    }

    function cj(fl, fp, fo, fn, fm) {
        if (!fn) {
            fn = es(fl.doc, fp.line)
        }
        return d7(fl, fn, dA(fl, fn, fp.ch, fm), fo)
    }

    function de(ft, fs, fn, fr, fv) {
        fr = fr || es(ft.doc, fs.line);
        if (!fv) {
            fv = aK(ft, fr)
        }

        function fp(fy, fx) {
            var fw = x(ft, fv, fy, fx ? "right" : "left");
            if (fx) {
                fw.left = fw.right
            } else {
                fw.right = fw.left
            }
            return d7(ft, fr, fw, fn)
        }

        function fu(fz, fw) {
            var fx = fq[fw],
                fy = fx.level % 2;
            if (fz == cX(fx) && fw && fx.level < fq[fw - 1].level) {
                fx = fq[--fw];
                fz = fg(fx) - (fx.level % 2 ? 0 : 1);
                fy = true
            } else {
                if (fz == fg(fx) && fw < fq.length - 1 && fx.level < fq[fw + 1].level) {
                    fx = fq[++fw];
                    fz = cX(fx) - fx.level % 2;
                    fy = false
                }
            }
            if (fy && fz == fx.to && fz > fx.from) {
                return fp(fz - 1)
            }
            return fp(fz, fy)
        }
        var fq = a(fr),
            fl = fs.ch;
        if (!fq) {
            return fp(fl)
        }
        var fm = aq(fq, fl);
        var fo = fu(fl, fm);
        if (ei != null) {
            fo.other = fu(fl, ei)
        }
        return fo
    }

    function c4(fl, fp) {
        var fo = 0;
        if (!fl.options.lineWrapping) {
            fo = c1(fl.display) * fp.ch
        }
        var fm = es(fl.doc, fp.line);
        var fn = bo(fm) + el(fl.display);
        return {
            left: fo,
            right: fo,
            top: fn,
            bottom: fn + fm.height
        }
    }

    function e4(fl, fm, fn, fp) {
        var fo = O(fl, fm);
        fo.xRel = fp;
        if (fn) {
            fo.outside = true
        }
        return fo
    }

    function eY(fs, fp, fo) {
        var fr = fs.doc;
        fo += fs.display.viewOffset;
        if (fo < 0) {
            return e4(fr.first, 0, true, -1)
        }
        var fn = bi(fr, fo),
            ft = fr.first + fr.size - 1;
        if (fn > ft) {
            return e4(fr.first + fr.size - 1, es(fr, ft).text.length, true, 1)
        }
        if (fp < 0) {
            fp = 0
        }
        var fm = es(fr, fn);
        for (;;) {
            var fu = cu(fs, fm, fn, fp, fo);
            var fq = dN(fm);
            var fl = fq && fq.find(0, true);
            if (fq && (fu.ch > fl.from.ch || fu.ch == fl.from.ch && fu.xRel > 0)) {
                fn = bp(fm = fl.to.line)
            } else {
                return fu
            }
        }
    }

    function cu(fv, fn, fy, fx, fw) {
        var fu = fw - bo(fn);
        var fr = false,
            fE = 2 * fv.display.wrapper.clientWidth;
        var fB = aK(fv, fn);

        function fI(fK) {
            var fL = de(fv, O(fy, fK), "line", fn, fB);
            fr = true;
            if (fu > fL.bottom) {
                return fL.left - fE
            } else {
                if (fu < fL.top) {
                    return fL.left + fE
                } else {
                    fr = false
                }
            }
            return fL.left
        }
        var fA = a(fn),
            fD = fn.text.length;
        var fF = cf(fn),
            fo = cr(fn);
        var fC = fI(fF),
            fl = fr,
            fm = fI(fo),
            fq = fr;
        if (fx > fm) {
            return e4(fy, fo, fq, 1)
        }
        for (;;) {
            if (fA ? fo == fF || fo == q(fn, fF, 1) : fo - fF <= 1) {
                var fz = fx < fC || fx - fC <= fm - fx ? fF : fo;
                var fH = fx - (fz == fF ? fC : fm);
                while (eD(fn.text.charAt(fz))) {
                    ++fz
                }
                var ft = e4(fy, fz, fz == fF ? fl : fq, fH < -1 ? -1 : fH > 1 ? 1 : 0);
                return ft
            }
            var fs = Math.ceil(fD / 2),
                fJ = fF + fs;
            if (fA) {
                fJ = fF;
                for (var fG = 0; fG < fs;
                    ++fG) {
                    fJ = q(fn, fJ, 1)
                }
            }
            var fp = fI(fJ);
            if (fp > fx) {
                fo = fJ;
                fm = fp;
                if (fq = fr) {
                    fm += 1000
                }
                fD = fs
            } else {
                fF = fJ;
                fC = fp;
                fl = fr;
                fD -= fs
            }
        }
    }
    var ar;

    function aD(fn) {
        if (fn.cachedTextHeight != null) {
            return fn.cachedTextHeight
        }
        if (ar == null) {
            ar = e5("pre");
            for (var fm = 0; fm < 49;
                ++fm) {
                ar.appendChild(document.createTextNode("x"));
                ar.appendChild(e5("br"))
            }
            ar.appendChild(document.createTextNode("x"))
        }
        bt(fn.measure, ar);
        var fl = ar.offsetHeight / 50;
        if (fl > 3) {
            fn.cachedTextHeight = fl
        }
        dk(fn.measure);
        return fl || 1
    }

    function c1(fp) {
        if (fp.cachedCharWidth != null) {
            return fp.cachedCharWidth
        }
        var fl = e5("span", "xxxxxxxxxx");
        var fo = e5("pre", [fl]);
        bt(fp.measure, fo);
        var fn = fl.getBoundingClientRect(),
            fm = (fn.right - fn.left) / 10;
        if (fm > 2) {
            fp.cachedCharWidth = fm
        }
        return fm || 10
    }
    var ds = 0;

    function ci(fl) {
        fl.curOp = {
            viewChanged: false,
            forceUpdate: false,
            updateInput: null,
            typing: false,
            changeObjs: null,
            cursorActivity: false,
            selectionChanged: false,
            updateMaxLine: false,
            scrollLeft: null,
            scrollTop: null,
            scrollToPos: null,
            id: ++ds
        };
        if (!b3++) {
            a3 = []
        }
    }

    function ab(fz) {
        var ft = fz.curOp,
            fy = fz.doc,
            fu = fz.display;
        fz.curOp = null;
        if (ft.viewChanged || ft.forceUpdate || ft.scrollTop != null || ft.scrollToPos && (ft.scrollToPos.from.line < fu.viewFrom || ft.scrollToPos.to.line >= fu.viewTo)) {
            var fr = c6(fz, {
                top: ft.scrollTop,
                ensure: ft.scrollToPos
            }, ft.forceUpdate);
            if (fz.display.scroller.offsetHeight) {
                fz.doc.scrollTop = fz.display.scroller.scrollTop
            }
        }
        if (!fr && ft.selectionChanged) {
            bf(fz)
        }
        if (ft.updateMaxLine) {
            e8(fz)
        }
        if (fu.maxLineChanged && !fz.options.lineWrapping && fu.maxLine) {
            var fn = dA(fz, fu.maxLine, fu.maxLine.text.length).left;
            fu.maxLineChanged = false;
            var fm = Math.max(0, fn + 3 + aZ);
            var fw = Math.max(0, fu.sizer.offsetLeft + fm - fu.scroller.clientWidth);
            fu.sizer.style.minWidth = fm + "px";
            if (fw < fy.scrollLeft && ft.scrollLeft == null) {
                bg(fz, Math.min(fu.scroller.scrollLeft, fw), true)
            }
            ef(fz)
        }
        if (ft.scrollTop != null && fu.scroller.scrollTop != ft.scrollTop) {
            var fv = Math.max(0, Math.min(fu.scroller.scrollHeight - fu.scroller.clientHeight, ft.scrollTop));
            fu.scroller.scrollTop = fu.scrollbarV.scrollTop = fy.scrollTop = fv
        }
        if (ft.scrollLeft != null && fu.scroller.scrollLeft != ft.scrollLeft) {
            var fo = Math.max(0, Math.min(fu.scroller.scrollWidth - fu.scroller.clientWidth, ft.scrollLeft));
            fu.scroller.scrollLeft = fu.scrollbarH.scrollLeft = fy.scrollLeft = fo;
            dX(fz)
        }
        if (ft.scrollToPos) {
            var fx = y(fz, eT(fz.doc, ft.scrollToPos.from), eT(fz.doc, ft.scrollToPos.to), ft.scrollToPos.margin);
            if (ft.scrollToPos.isCursor && fz.state.focused) {
                dq(fz, fx)
            }
        }
        if (ft.selectionChanged) {
            l(fz)
        }
        if (fz.state.focused && ft.updateInput) {
            eC(fz, ft.typing)
        }
        var fs = ft.maybeHiddenMarkers,
            fl = ft.maybeUnhiddenMarkers;
        if (fs) {
            for (var fq = 0; fq < fs.length;
                ++fq) {
                if (!fs[fq].lines.length) {
                    ao(fs[fq], "hide")
                }
            }
        }
        if (fl) {
            for (var fq = 0; fq < fl.length;
                ++fq) {
                if (fl[fq].lines.length) {
                    ao(fl[fq], "unhide")
                }
            }
        }
        var fp;
        if (!--b3) {
            fp = a3;
            a3 = null
        }
        if (ft.changeObjs) {
            for (var fq = 0; fq < ft.changeObjs.length; fq++) {
                ao(fz, "change", fz, ft.changeObjs[fq])
            }
        }
        if (ft.cursorActivity) {
            ao(fz, "cursorActivity", fz)
        }
        if (fp) {
            for (var fq = 0; fq < fp.length;
                ++fq) {
                fp[fq]()
            }
        }
    }

    function cm(fl, fm) {
        if (fl.curOp) {
            return fm()
        }
        ci(fl);
        try {
            return fm()
        } finally {
            ab(fl)
        }
    }

    function cx(fl, fm) {
        return function() {
            if (fl.curOp) {
                return fm.apply(fl, arguments)
            }
            ci(fl);
            try {
                return fm.apply(fl, arguments)
            } finally {
                ab(fl)
            }
        }
    }

    function cD(fl) {
        return function() {
            if (this.curOp) {
                return fl.apply(this, arguments)
            }
            ci(this);
            try {
                return fl.apply(this, arguments)
            } finally {
                ab(this)
            }
        }
    }

    function cd(fl) {
        return function() {
            var fm = this.cm;
            if (!fm || fm.curOp) {
                return fl.apply(this, arguments)
            }
            ci(fm);
            try {
                return fl.apply(this, arguments)
            } finally {
                ab(fm)
            }
        }
    }

    function ba(fn, fl, fm) {
        this.line = fl;
        this.rest = f(fl);
        this.size = this.rest ? bp(eR(this.rest)) - fm + 1 : 1;
        this.node = this.text = null;
        this.hidden = eJ(fn, fl)
    }

    function ec(fl, fr, fq) {
        var fp = [],
            fn;
        for (var fo = fr; fo < fq; fo = fn) {
            var fm = new ba(fl.doc, es(fl.doc, fo), fo);
            fn = fo + fm.size;
            fp.push(fm)
        }
        return fp
    }

    function W(fl, fq, fp, fn) {
        if (fq == null) {
            fq = fl.doc.first
        }
        if (fp == null) {
            fp = fl.doc.first + fl.doc.size
        }
        if (!fn) {
            fn = 0
        }
        if (aN) {
            fq = aB(fl.doc, fq);
            fp = dm(fl.doc, fp)
        }
        var fo = fl.display;
        if (fn && fp < fo.viewTo && (fo.updateLineNumbers == null || fo.updateLineNumbers > fq)) {
            fo.updateLineNumbers = fq
        }
        fl.curOp.viewChanged = true;
        if (fq >= fo.viewTo) {} else {
            if (fp <= fo.viewFrom) {
                fo.viewFrom += fn;
                fo.viewTo += fn
            } else {
                if (fq <= fo.viewFrom && fp >= fo.viewTo) {
                    dP(fl)
                } else {
                    if (fq <= fo.viewFrom) {
                        fo.view = fo.view.slice(cR(fl, fp));
                        fo.viewFrom = fp + fn;
                        fo.viewTo += fn
                    } else {
                        if (fp >= fo.viewTo) {
                            fo.view = fo.view.slice(0, cR(fl, fq));
                            fo.viewTo = fq
                        } else {
                            fo.view = fo.view.slice(0, cR(fl, fq)).concat(ec(fl, fq, fp + fn)).concat(fo.view.slice(cR(fl, fp)));
                            fo.viewTo += fn
                        }
                    }
                }
            }
        }
        var fm = fo.externalMeasured;
        if (fm) {
            if (fp < fm.lineN) {
                fm.lineN += fn
            } else {
                if (fq < fm.lineN + fm.size) {
                    fo.externalMeasured = null
                }
            }
        }
    }

    function L(fm, fn, fq) {
        fm.curOp.viewChanged = true;
        var fr = fm.display,
            fp = fm.display.externalMeasured;
        if (fp && fn >= fp.lineN && fn < fp.lineN + fp.size) {
            fr.externalMeasured = null
        }
        if (fn < fr.viewFrom || fn >= fr.viewTo) {
            return
        }
        var fo = fr.view[cR(fm, fn)];
        if (fo.node == null) {
            return
        }
        var fl = fo.changes || (fo.changes = []);
        if (cM(fl, fq) == -1) {
            fl.push(fq)
        }
    }

    function dP(fl) {
        fl.display.viewFrom = fl.display.viewTo = fl.doc.first;
        fl.display.view = [];
        fl.display.viewOffset = 0
    }

    function cR(fl, fo) {
        if (fo >= fl.display.viewTo) {
            return null
        }
        fo -= fl.display.viewFrom;
        if (fo < 0) {
            return null
        }
        var fm = fl.display.view;
        for (var fn = 0; fn < fm.length; fn++) {
            fo -= fm[fn].size;
            if (fo < 0) {
                return fn
            }
        }
    }

    function cq(fl, fp, fo) {
        var fn = fl.display,
            fm = fn.view;
        if (fm.length == 0 || fp >= fn.viewTo || fo <= fn.viewFrom) {
            fn.view = ec(fl, fp, fo);
            fn.viewFrom = fp
        } else {
            if (fn.viewFrom > fp) {
                fn.view = ec(fl, fp, fn.viewFrom).concat(fn.view)
            } else {
                if (fn.viewFrom < fp) {
                    fn.view = fn.view.slice(cR(fl, fp))
                }
            }
            fn.viewFrom = fp;
            if (fn.viewTo < fo) {
                fn.view = fn.view.concat(ec(fl, fn.viewTo, fo))
            } else {
                if (fn.viewTo > fo) {
                    fn.view = fn.view.slice(0, cR(fl, fo))
                }
            }
        }
        fn.viewTo = fo
    }

    function cG(fl) {
        var fm = fl.display.view,
            fp = 0;
        for (var fo = 0; fo < fm.length; fo++) {
            var fn = fm[fo];
            if (!fn.hidden && (!fn.node || fn.changes)) {
                ++fp
            }
        }
        return fp
    }

    function a1(fl) {
        if (fl.display.pollingFast) {
            return
        }
        fl.display.poll.set(fl.options.pollInterval, function() {
            bT(fl);
            if (fl.state.focused) {
                a1(fl)
            }
        })
    }

    function w(fl) {
        var fm = false;
        fl.display.pollingFast = true;

        function fn() {
            var fo = bT(fl);
            if (!fo && !fm) {
                fm = true;
                fl.display.poll.set(60, fn)
            } else {
                fl.display.pollingFast = false;
                a1(fl)
            }
        }
        fl.display.poll.set(20, fn)
    }

    function bT(fo) {
        var fq = fo.display.input,
            fs = fo.display.prevInput,
            fD = fo.doc;
        if (!fo.state.focused || a7(fq) || Y(fo) || fo.options.disableInput) {
            return false
        }
        if (fo.state.pasteIncoming && fo.state.fakedLastChar) {
            fq.value = fq.value.substring(0, fq.value.length - 1);
            fo.state.fakedLastChar = false
        }
        var fr = fq.value;
        if (fr == fs && !fo.somethingSelected()) {
            return false
        }
        if (d3 && !bK && fo.display.inputHasSelection === fr) {
            eC(fo);
            return false
        }
        var fz = !fo.curOp;
        if (fz) {
            ci(fo)
        }
        fo.display.shift = false;
        var fy = 0,
            fv = Math.min(fs.length, fr.length);
        while (fy < fv && fs.charCodeAt(fy) == fr.charCodeAt(fy)) {
            ++fy
        }
        var fm = fr.slice(fy),
            ft = aG(fm);
        var fC = fo.state.pasteIncoming && ft.length > 1 && fD.sel.ranges.length == ft.length;
        for (var fA = fD.sel.ranges.length - 1; fA >= 0; fA--) {
            var fu = fD.sel.ranges[fA];
            var fw = fu.from(),
                fl = fu.to();
            if (fy < fs.length) {
                fw = O(fw.line, fw.ch - (fs.length - fy))
            } else {
                if (fo.state.overwrite && fu.empty() && !fo.state.pasteIncoming) {
                    fl = O(fl.line, Math.min(es(fD, fl.line).text.length, fl.ch + eR(ft).length))
                }
            }
            var fn = fo.curOp.updateInput;
            var fB = {
                from: fw,
                to: fl,
                text: fC ? [ft[fA]] : ft,
                origin: fo.state.pasteIncoming ? "paste" : fo.state.cutIncoming ? "cut" : "+input"
            };
            aV(fo.doc, fB);
            T(fo, "inputRead", fo, fB);
            if (fm && !fo.state.pasteIncoming && fo.options.electricChars && fo.options.smartIndent && fu.head.ch < 100 && (!fA || fD.sel.ranges[fA - 1].head.line != fu.head.line)) {
                var fp = fo.getModeAt(fu.head).electricChars;
                if (fp) {
                    for (var fx = 0; fx < fp.length; fx++) {
                        if (fm.indexOf(fp.charAt(fx)) > -1) {
                            S(fo, fu.head.line, "smart");
                            break
                        }
                    }
                }
            }
        }
        eQ(fo);
        fo.curOp.updateInput = fn;
        fo.curOp.typing = true;
        if (fr.length > 1000 || fr.indexOf("\n") > -1) {
            fq.value = fo.display.prevInput = ""
        } else {
            fo.display.prevInput = fr
        }
        if (fz) {
            ab(fo)
        }
        fo.state.pasteIncoming = fo.state.cutIncoming = false;
        return true
    }

    function eC(fl, fp) {
        var fm, fo, fr = fl.doc;
        if (fl.somethingSelected()) {
            fl.display.prevInput = "";
            var fn = fr.sel.primary();
            fm = cF && (fn.to().line - fn.from().line > 100 || (fo = fl.getSelection()).length > 1000);
            var fq = fm ? "-" : fo || fl.getSelection();
            fl.display.input.value = fq;
            if (fl.state.focused) {
                c7(fl.display.input)
            }
            if (d3 && !bK) {
                fl.display.inputHasSelection = fq
            }
        } else {
            if (!fp) {
                fl.display.prevInput = fl.display.input.value = "";
                if (d3 && !bK) {
                    fl.display.inputHasSelection = null
                }
            }
        }
        fl.display.inaccurateSelection = fm
    }

    function dT(fl) {
        if (fl.options.readOnly != "nocursor" && (!dz || c9() != fl.display.input)) {
            fl.display.input.focus()
        }
    }

    function Y(fl) {
        return fl.options.readOnly || fl.doc.cantEdit
    }

    function eZ(fm) {
        var fr = fm.display;
        bz(fr.scroller, "mousedown", cx(fm, dL));
        if (d3) {
            bz(fr.scroller, "dblclick", cx(fm, function(fu) {
                if (ay(fm, fu)) {
                    return
                }
                var fv = bZ(fm, fu);
                if (!fv || j(fm, fu) || aQ(fm.display, fu)) {
                    return
                }
                cg(fu);
                var ft = ai(es(fm.doc, fv.line).text, fv);
                e2(fm.doc, ft.from, ft.to)
            }))
        } else {
            bz(fr.scroller, "dblclick", function(ft) {
                ay(fm, ft) || cg(ft)
            })
        }
        bz(fr.lineSpace, "selectstart", function(ft) {
            if (!aQ(fr, ft)) {
                cg(ft)
            }
        });
        if (!fd) {
            bz(fr.scroller, "contextmenu", function(ft) {
                al(fm, ft)
            })
        }
        bz(fr.scroller, "scroll", function() {
            if (fr.scroller.clientHeight) {
                H(fm, fr.scroller.scrollTop);
                bg(fm, fr.scroller.scrollLeft, true);
                ao(fm, "scroll", fm)
            }
        });
        bz(fr.scrollbarV, "scroll", function() {
            if (fr.scroller.clientHeight) {
                H(fm, fr.scrollbarV.scrollTop)
            }
        });
        bz(fr.scrollbarH, "scroll", function() {
            if (fr.scroller.clientHeight) {
                bg(fm, fr.scrollbarH.scrollLeft)
            }
        });
        bz(fr.scroller, "mousewheel", function(ft) {
            b(fm, ft)
        });
        bz(fr.scroller, "DOMMouseScroll", function(ft) {
            b(fm, ft)
        });

        function fs() {
            if (fm.state.focused) {
                setTimeout(b7(dT, fm), 0)
            }
        }
        bz(fr.scrollbarH, "mousedown", fs);
        bz(fr.scrollbarV, "mousedown", fs);
        bz(fr.wrapper, "scroll", function() {
            fr.wrapper.scrollTop = fr.wrapper.scrollLeft = 0
        });
        var fl;

        function fp() {
            if (fl == null) {
                fl = setTimeout(function() {
                    fl = null;
                    fr.cachedCharWidth = fr.cachedTextHeight = dO = null;
                    fm.setSize()
                }, 100)
            }
        }
        bz(window, "resize", fp);

        function fo() {
            for (var ft = fr.wrapper.parentNode; ft && ft != document.body; ft = ft.parentNode) {}
            if (ft) {
                setTimeout(fo, 5000)
            } else {
                dw(window, "resize", fp)
            }
        }
        setTimeout(fo, 5000);
        bz(fr.input, "keyup", cx(fm, aX));
        bz(fr.input, "input", function() {
            if (d3 && !bK && fm.display.inputHasSelection) {
                fm.display.inputHasSelection = null
            }
            w(fm)
        });
        bz(fr.input, "keydown", cx(fm, m));
        bz(fr.input, "keypress", cx(fm, b9));
        bz(fr.input, "focus", b7(cc, fm));
        bz(fr.input, "blur", b7(aA, fm));

        function fn(ft) {
            if (!ay(fm, ft)) {
                dJ(ft)
            }
        }
        if (fm.options.dragDrop) {
            bz(fr.scroller, "dragstart", function(ft) {
                K(fm, ft)
            });
            bz(fr.scroller, "dragenter", fn);
            bz(fr.scroller, "dragover", fn);
            bz(fr.scroller, "drop", cx(fm, aY))
        }
        bz(fr.scroller, "paste", function(ft) {
            if (aQ(fr, ft)) {
                return
            }
            fm.state.pasteIncoming = true;
            dT(fm);
            w(fm)
        });
        bz(fr.input, "paste", function() {
            if (cv && !fm.state.fakedLastChar && !(new Date - fm.state.lastMiddleDown < 200)) {
                var fu = fr.input.selectionStart,
                    ft = fr.input.selectionEnd;
                fr.input.value += "$";
                fr.input.selectionStart = fu;
                fr.input.selectionEnd = ft;
                fm.state.fakedLastChar = true
            }
            fm.state.pasteIncoming = true;
            w(fm)
        });

        function fq(ft) {
            if (fr.inaccurateSelection) {
                fr.prevInput = "";
                fr.inaccurateSelection = false;
                fr.input.value = fm.getSelection();
                c7(fr.input)
            }
            if (ft.type == "cut") {
                fm.state.cutIncoming = true
            }
        }
        bz(fr.input, "cut", fq);
        bz(fr.input, "copy", fq);
        if (aR) {
            bz(fr.sizer, "mouseup", function() {
                if (c9() == fr.input) {
                    fr.input.blur()
                }
                dT(fm)
            })
        }
    }

    function aQ(fm, fl) {
        for (var fn = G(fl); fn != fm.wrapper; fn = fn.parentNode) {
            if (!fn || fn.ignoreEvents || fn.parentNode == fm.sizer && fn != fm.mover) {
                return true
            }
        }
    }

    function bZ(fv, fp, fm, fn) {
        var fr = fv.display;
        if (!fm) {
            var fq = G(fp);
            if (fq == fr.scrollbarH || fq == fr.scrollbarH.firstChild || fq == fr.scrollbarV || fq == fr.scrollbarV.firstChild || fq == fr.scrollbarFiller || fq == fr.gutterFiller) {
                return null
            }
        }
        var fu, fs, fl = fr.lineSpace.getBoundingClientRect();
        try {
            fu = fp.clientX - fl.left;
            fs = fp.clientY - fl.top
        } catch (fp) {
            return null
        }
        var ft = eY(fv, fu, fs),
            fw;
        if (fn && ft.xRel == 1 && (fw = es(fv.doc, ft.line).text).length == ft.ch) {
            var fo = bv(fw, fw.length, fv.options.tabSize) - fw.length;
            ft = O(ft.line, Math.round((fu - aC(fv.display)) / c1(fv.display)) - fo)
        }
        return ft
    }

    function dL(fn) {
        if (ay(this, fn)) {
            return
        }
        var fl = this,
            fm = fl.display;
        fm.shift = fn.shiftKey;
        if (aQ(fm, fn)) {
            if (!cv) {
                fm.scroller.draggable = false;
                setTimeout(function() {
                    fm.scroller.draggable = true
                }, 100)
            }
            return
        }
        if (j(fl, fn)) {
            return
        }
        var fo = bZ(fl, fn);
        window.focus();
        switch (eX(fn)) {
            case 1:
                if (fo) {
                    ak(fl, fn, fo)
                } else {
                    if (G(fn) == fm.scroller) {
                        cg(fn)
                    }
                }
                break;
            case 2:
                if (cv) {
                    fl.state.lastMiddleDown = +new Date
                }
                if (fo) {
                    e2(fl.doc, fo)
                }
                setTimeout(b7(dT, fl), 20);
                cg(fn);
                break;
            case 3:
                if (fd) {
                    al(fl, fn)
                }
                break
        }
    }
    var cO, cI;

    function ak(fl, fp, fq) {
        if (!fl.state.focused) {
            cc(fl)
        }
        var fm = +new Date,
            fn;
        if (cI && cI.time > fm - 400 && bR(cI.pos, fq) == 0) {
            fn = "triple"
        } else {
            if (cO && cO.time > fm - 400 && bR(cO.pos, fq) == 0) {
                fn = "double";
                cI = {
                    time: fm,
                    pos: fq
                }
            } else {
                fn = "single";
                cO = {
                    time: fm,
                    pos: fq
                }
            }
        }
        var fo = fl.doc.sel;
        if (fl.options.dragDrop && d4 && !Y(fl) && fn == "single" && fo.contains(fq) > -1 && fo.somethingSelected()) {
            aJ(fl, fp, fq)
        } else {
            ck(fl, fp, fq, fn)
        }
    }

    function aJ(fm, fo, fp) {
        var fn = fm.display;
        var fl = cx(fm, function(fq) {
            if (cv) {
                fn.scroller.draggable = false
            }
            fm.state.draggingText = false;
            dw(document, "mouseup", fl);
            dw(fn.scroller, "drop", fl);
            if (Math.abs(fo.clientX - fq.clientX) + Math.abs(fo.clientY - fq.clientY) < 10) {
                cg(fq);
                e2(fm.doc, fp);
                dT(fm);
                if (d3 && !bK) {
                    setTimeout(function() {
                        document.body.focus();
                        dT(fm)
                    }, 20)
                }
            }
        });
        if (cv) {
            fn.scroller.draggable = true
        }
        fm.state.draggingText = fl;
        if (fn.scroller.dragDrop) {
            fn.scroller.dragDrop()
        }
        bz(document, "mouseup", fl);
        bz(fn.scroller, "drop", fl)
    }

    function ck(fz, ft, fn, fw) {
        var fv = fz.display,
            fy = fz.doc;
        cg(ft);
        cz(fy, fy.history.done);
        fy.history.atomicSelection = true;
        if (bH ? ft.metaKey : ft.ctrlKey) {
            var fp = fy.sel.contains(fn);
            if (fp > -1) {
                bw(fy, new e6(fy.sel.ranges, fp), false)
            } else {
                bw(fy, b8(fy.sel.ranges.concat([new di(fn, fn)]), fy.sel.ranges.length), false)
            }
        } else {
            if (ft.altKey) {
                A(fy, fn, fn);
                fw = "rect";
                fn = bZ(fz, ft, true, true)
            } else {
                e2(fy, fn, fn)
            }
        }
        var fx = fn,
            fm = fy.sel;

        function fA(fM, fD) {
            if (!fD && bR(fx, fM) == 0) {
                return
            }
            fx = fM;
            if (fw == "rect") {
                var fC = [],
                    fJ = fz.options.tabSize;
                var fB = bv(es(fy, fn.line).text, fn.ch, fJ);
                var fP = bv(es(fy, fM.line).text, fM.ch, fJ);
                var fE = Math.min(fB, fP),
                    fN = Math.max(fB, fP);
                for (var fQ = Math.min(fn.line, fM.line), fG = Math.min(fz.lastLine(), Math.max(fn.line, fM.line)); fQ <= fG; fQ++) {
                    var fO = es(fy, fQ).text,
                        fF = dI(fO, fE, fJ);
                    if (fE == fN) {
                        fC.push(new di(O(fQ, fF), O(fQ, fF)))
                    } else {
                        if (fO.length > fF) {
                            fC.push(new di(O(fQ, fF), O(fQ, dI(fO, fN, fJ))))
                        }
                    }
                }
                if (!fC.length) {
                    fC.push(new di(fn, fn))
                }
                bw(fy, new e6(fC, fC.length - 1))
            } else {
                var fK = fm.primary();
                var fH = fK.anchor,
                    fL = fM;
                if (fw != "single") {
                    if (fw == "double") {
                        var fI = ai(es(fy, fM.line).text, fM)
                    } else {
                        var fI = {
                            from: O(fM.line, 0),
                            to: eT(fy, O(fM.line + 1, 0))
                        }
                    }
                    if (bR(fI.to, fH) > 0) {
                        fL = fI.to;
                        fH = ae(fK.from(), fI.from)
                    } else {
                        fL = fI.from;
                        fH = bc(fK.to(), fI.to)
                    }
                }
                var fC = fm.ranges.slice(0);
                fC[fm.primIndex] = new di(eT(fy, fH), fL);
                bw(fy, b8(fC, fm.primIndex))
            }
        }
        if (fw == "double" || fw == "triple") {
            fA(fn, true);
            fm = fy.sel
        }
        var fr = fv.wrapper.getBoundingClientRect();
        var fl = 0;

        function fu(fD) {
            var fB = ++fl;
            var fF = bZ(fz, fD, true, fw == "rect");
            if (!fF) {
                return
            }
            if (bR(fF, fx) != 0) {
                if (!fz.state.focused) {
                    cc(fz)
                }
                fA(fF);
                var fE = bG(fv, fy);
                if (fF.line >= fE.to || fF.line < fE.from) {
                    setTimeout(cx(fz, function() {
                        if (fl == fB) {
                            fu(fD)
                        }
                    }), 150)
                }
            } else {
                var fC = fD.clientY < fr.top ? -20 : fD.clientY > fr.bottom ? 20 : 0;
                if (fC) {
                    setTimeout(cx(fz, function() {
                        if (fl != fB) {
                            return
                        }
                        fv.scroller.scrollTop += fC;
                        fu(fD)
                    }), 50)
                }
            }
        }

        function fq(fB) {
            fl = Infinity;
            cg(fB);
            dT(fz);
            dw(document, "mousemove", fo);
            dw(document, "mouseup", fs);
            cz(fy, fy.history.done);
            fy.history.atomicSelection = false
        }
        var fo = cx(fz, function(fB) {
            if (!bK && (c5 ? !fB.buttons : !eX(fB))) {
                fq(fB)
            } else {
                fu(fB)
            }
        });
        var fs = cx(fz, fq);
        bz(document, "mousemove", fo);
        bz(document, "mouseup", fs)
    }

    function fj(fw, fs, fu, fv, fo) {
        try {
            var fm = fs.clientX,
                fl = fs.clientY
        } catch (fs) {
            return false
        }
        if (fm >= Math.floor(fw.display.gutters.getBoundingClientRect().right)) {
            return false
        }
        if (fv) {
            cg(fs)
        }
        var ft = fw.display;
        var fr = ft.lineDiv.getBoundingClientRect();
        if (fl > fr.bottom || !ev(fw, fu)) {
            return bn(fs)
        }
        fl -= fr.top - ft.viewOffset;
        for (var fp = 0; fp < fw.options.gutters.length;
            ++fp) {
            var fq = ft.gutters.childNodes[fp];
            if (fq && fq.getBoundingClientRect().right >= fm) {
                var fx = bi(fw.doc, fl);
                var fn = fw.options.gutters[fp];
                fo(fw, fu, fw, fx, fn, fs);
                return bn(fs)
            }
        }
    }

    function j(fl, fm) {
        return fj(fl, fm, "gutterClick", true, T)
    }
    var V = 0;

    function aY(fr) {
        var ft = this;
        if (ay(ft, fr) || aQ(ft.display, fr)) {
            return
        }
        cg(fr);
        if (d3) {
            V = +new Date
        }
        var fs = bZ(ft, fr, true),
            fl = fr.dataTransfer.files;
        if (!fs || Y(ft)) {
            return
        }
        if (fl && fl.length && window.FileReader && window.File) {
            var fn = fl.length,
                fu = Array(fn),
                fm = 0;
            var fp = function(fx, fw) {
                var fv = new FileReader;
                fv.onload = function() {
                    fu[fw] = fv.result;
                    if (++fm == fn) {
                        fs = eT(ft.doc, fs);
                        var fy = {
                            from: fs,
                            to: fs,
                            text: aG(fu.join("\n")),
                            origin: "paste"
                        };
                        aV(ft.doc, fy);
                        ek(ft.doc, d8(fs, cs(fy)))
                    }
                };
                fv.readAsText(fx)
            };
            for (var fq = 0; fq < fn;
                ++fq) {
                fp(fl[fq], fq)
            }
        } else {
            if (ft.state.draggingText && ft.doc.sel.contains(fs) > -1) {
                ft.state.draggingText(fr);
                setTimeout(b7(dT, ft), 20);
                return
            }
            try {
                var fu = fr.dataTransfer.getData("Text");
                if (fu) {
                    var fo = ft.state.draggingText && ft.listSelections();
                    dH(ft.doc, d8(fs, fs));
                    if (fo) {
                        for (var fq = 0; fq < fo.length;
                            ++fq) {
                            aH(ft.doc, "", fo[fq].anchor, fo[fq].head, "drag")
                        }
                    }
                    ft.replaceSelection(fu, "around", "paste");
                    dT(ft)
                }
            } catch (fr) {}
        }
    }

    function K(fl, fn) {
        if (d3 && (!fl.state.draggingText || +new Date - V < 100)) {
            dJ(fn);
            return
        }
        if (ay(fl, fn) || aQ(fl.display, fn)) {
            return
        }
        fn.dataTransfer.setData("Text", fl.getSelection());
        if (fn.dataTransfer.setDragImage && !an) {
            var fm = e5("img", null, null, "position: fixed; left: 0; top: 0;");
            fm.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            if (dl) {
                fm.width = fm.height = 1;
                fl.display.wrapper.appendChild(fm);
                fm._top = fm.offsetTop
            }
            fn.dataTransfer.setDragImage(fm, 0, 0);
            if (dl) {
                fm.parentNode.removeChild(fm)
            }
        }
    }

    function H(fl, fm) {
        if (Math.abs(fl.doc.scrollTop - fm) < 2) {
            return
        }
        fl.doc.scrollTop = fm;
        if (!b0) {
            c6(fl, {
                top: fm
            })
        }
        if (fl.display.scroller.scrollTop != fm) {
            fl.display.scroller.scrollTop = fm
        }
        if (fl.display.scrollbarV.scrollTop != fm) {
            fl.display.scrollbarV.scrollTop = fm
        }
        if (b0) {
            c6(fl)
        }
        dy(fl, 100)
    }

    function bg(fl, fn, fm) {
        if (fm ? fn == fl.doc.scrollLeft : Math.abs(fl.doc.scrollLeft - fn) < 2) {
            return
        }
        fn = Math.min(fn, fl.display.scroller.scrollWidth - fl.display.scroller.clientWidth);
        fl.doc.scrollLeft = fn;
        dX(fl);
        if (fl.display.scroller.scrollLeft != fn) {
            fl.display.scroller.scrollLeft = fn
        }
        if (fl.display.scrollbarH.scrollLeft != fn) {
            fl.display.scrollbarH.scrollLeft = fn
        }
    }
    var ez = 0,
        bS = null;
    if (c5) {
        bS = -0.53
    } else {
        if (b0) {
            bS = 15
        } else {
            if (cH) {
                bS = -0.7
            } else {
                if (an) {
                    bS = -1 / 3
                }
            }
        }
    }

    function b(ft, fn) {
        var fw = fn.wheelDeltaX,
            fv = fn.wheelDeltaY;
        if (fw == null && fn.detail && fn.axis == fn.HORIZONTAL_AXIS) {
            fw = fn.detail
        }
        if (fv == null && fn.detail && fn.axis == fn.VERTICAL_AXIS) {
            fv = fn.detail
        } else {
            if (fv == null) {
                fv = fn.wheelDelta
            }
        }
        var fp = ft.display,
            fs = fp.scroller;
        if (!(fw && fs.scrollWidth > fs.clientWidth || fv && fs.scrollHeight > fs.clientHeight)) {
            return
        }
        if (fv && bH && cv) {
            outer: for (var fu = fn.target, fr = fp.view; fu != fs; fu = fu.parentNode) {
                for (var fm = 0; fm < fr.length; fm++) {
                    if (fr[fm].node == fu) {
                        ft.display.currentWheelTarget = fu;
                        break outer
                    }
                }
            }
        }
        if (fw && !b0 && !dl && bS != null) {
            if (fv) {
                H(ft, Math.max(0, Math.min(fs.scrollTop + fv * bS, fs.scrollHeight - fs.clientHeight)))
            }
            bg(ft, Math.max(0, Math.min(fs.scrollLeft + fw * bS, fs.scrollWidth - fs.clientWidth)));
            cg(fn);
            fp.wheelStartX = null;
            return
        }
        if (fv && bS != null) {
            var fl = fv * bS;
            var fq = ft.doc.scrollTop,
                fo = fq + fp.wrapper.clientHeight;
            if (fl < 0) {
                fq = Math.max(0, fq + fl - 50)
            } else {
                fo = Math.min(ft.doc.height, fo + fl + 50)
            }
            c6(ft, {
                top: fq,
                bottom: fo
            })
        }
        if (ez < 20) {
            if (fp.wheelStartX == null) {
                fp.wheelStartX = fs.scrollLeft;
                fp.wheelStartY = fs.scrollTop;
                fp.wheelDX = fw;
                fp.wheelDY = fv;
                setTimeout(function() {
                    if (fp.wheelStartX == null) {
                        return
                    }
                    var fx = fs.scrollLeft - fp.wheelStartX;
                    var fz = fs.scrollTop - fp.wheelStartY;
                    var fy = (fz && fp.wheelDY && fz / fp.wheelDY) || (fx && fp.wheelDX && fx / fp.wheelDX);
                    fp.wheelStartX = fp.wheelStartY = null;
                    if (!fy) {
                        return
                    }
                    bS = (bS * ez + fy) / (ez + 1);
                    ++ez
                }, 200)
            } else {
                fp.wheelDX += fw;
                fp.wheelDY += fv
            }
        }
    }

    function e0(fm, fp, fl) {
        if (typeof fp == "string") {
            fp = dW[fp];
            if (!fp) {
                return false
            }
        }
        if (fm.display.pollingFast && bT(fm)) {
            fm.display.pollingFast = false
        }
        var fo = fm.display.shift,
            fn = false;
        try {
            if (Y(fm)) {
                fm.state.suppressEdits = true
            }
            if (fl) {
                fm.display.shift = false
            }
            fn = fp(fm) != bL
        } finally {
            fm.display.shift = fo;
            fm.state.suppressEdits = false
        }
        return fn
    }

    function cT(fl) {
        var fm = fl.state.keyMaps.slice(0);
        if (fl.options.extraKeys) {
            fm.push(fl.options.extraKeys)
        }
        fm.push(fl.options.keyMap);
        return fm
    }
    var af;

    function ew(fl, fr) {
        var fm = e3(fl.options.keyMap),
            fp = fm.auto;
        clearTimeout(af);
        if (fp && !dV(fr)) {
            af = setTimeout(function() {
                if (e3(fl.options.keyMap) == fm) {
                    fl.options.keyMap = (fp.call ? fp.call(null, fl) : fp);
                    fi(fl)
                }
            }, 50)
        }
        var fo = eE(fr, true),
            fq = false;
        if (!fo) {
            return false
        }
        var fn = cT(fl);
        if (fr.shiftKey) {
            fq = g("Shift-" + fo, fn, function(fs) {
                return e0(fl, fs, true)
            }) || g(fo, fn, function(fs) {
                if (typeof fs == "string" ? /^go[A-Z]/.test(fs) : fs.motion) {
                    return e0(fl, fs)
                }
            })
        } else {
            fq = g(fo, fn, function(fs) {
                return e0(fl, fs)
            })
        }
        if (fq) {
            cg(fr);
            l(fl);
            T(fl, "keyHandled", fl, fo, fr)
        }
        return fq
    }

    function dC(fl, fo, fm) {
        var fn = g("'" + fm + "'", cT(fl), function(fp) {
            return e0(fl, fp, true)
        });
        if (fn) {
            cg(fo);
            l(fl);
            T(fl, "keyHandled", fl, "'" + fm + "'", fo)
        }
        return fn
    }
    var cN = null;

    function m(fo) {
        var fl = this;
        if (!fl.state.focused) {
            cc(fl)
        }
        if (ay(fl, fo)) {
            return
        }
        if (d3 && fo.keyCode == 27) {
            fo.returnValue = false
        }
        var fm = fo.keyCode;
        fl.display.shift = fm == 16 || fo.shiftKey;
        var fn = ew(fl, fo);
        if (dl) {
            cN = fn ? fm : null;
            if (!fn && fm == 88 && !cF && (bH ? fo.metaKey : fo.ctrlKey)) {
                fl.replaceSelection("")
            }
        }
    }

    function aX(fl) {
        if (ay(this, fl)) {
            return
        }
        if (fl.keyCode == 16) {
            this.doc.sel.shift = false
        }
    }

    function b9(fp) {
        var fl = this;
        if (ay(fl, fp)) {
            return
        }
        var fo = fp.keyCode,
            fm = fp.charCode;
        if (dl && fo == cN) {
            cN = null;
            cg(fp);
            return
        }
        if (((dl && (!fp.which || fp.which < 10)) || aR) && ew(fl, fp)) {
            return
        }
        var fn = String.fromCharCode(fm == null ? fo : fm);
        if (dC(fl, fp, fn)) {
            return
        }
        if (d3 && !bK) {
            fl.display.inputHasSelection = null
        }
        w(fl)
    }

    function cc(fl) {
        if (fl.options.readOnly == "nocursor") {
            return
        }
        if (!fl.state.focused) {
            ao(fl, "focus", fl);
            fl.state.focused = true;
            if (fl.display.wrapper.className.search(/\bCodeMirror-focused\b/) == -1) {
                fl.display.wrapper.className += " CodeMirror-focused"
            }
            if (!fl.curOp) {
                eC(fl);
                if (cv) {
                    setTimeout(b7(eC, fl, true), 0)
                }
            }
        }
        a1(fl);
        l(fl)
    }

    function aA(fl) {
        if (fl.state.focused) {
            ao(fl, "blur", fl);
            fl.state.focused = false;
            fl.display.wrapper.className = fl.display.wrapper.className.replace(" CodeMirror-focused", "")
        }
        clearInterval(fl.display.blinker);
        setTimeout(function() {
            if (!fl.state.focused) {
                fl.display.shift = false
            }
        }, 150)
    }
    var eN;

    function al(fv, fp) {
        if (ay(fv, fp, "contextmenu")) {
            return
        }
        var fr = fv.display;
        if (aQ(fr, fp) || cL(fv, fp)) {
            return
        }
        var ft = bZ(fv, fp),
            fl = fr.scroller.scrollTop;
        if (!ft || dl) {
            return
        }
        var fo = fv.options.resetSelectionOnContextMenu;
        if (fo && fv.doc.sel.contains(ft) == -1) {
            cx(fv, bw)(fv.doc, d8(ft), false)
        }
        var fq = fr.input.style.cssText;
        fr.inputDiv.style.position = "absolute";
        fr.input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (fp.clientY - 5) + "px; left: " + (fp.clientX - 5) + "px; z-index: 1000; background: transparent; outline: none;border-width: 0; outline: none; overflow: hidden; opacity: .05; -ms-opacity: .05; filter: alpha(opacity=5);";
        dT(fv);
        eC(fv);
        var fu = fv.somethingSelected();
        if (!fu) {
            fr.input.value = fr.prevInput = " "
        }

        function fn() {
            if (fr.input.selectionStart != null) {
                var fw = fr.input.value = "\u200b" + (fu ? fr.input.value : "");
                fr.prevInput = "\u200b";
                fr.input.selectionStart = 1;
                fr.input.selectionEnd = fw.length
            }
        }

        function fs() {
            fr.inputDiv.style.position = "relative";
            fr.input.style.cssText = fq;
            if (bK) {
                fr.scrollbarV.scrollTop = fr.scroller.scrollTop = fl
            }
            a1(fv);
            if (fr.input.selectionStart != null) {
                if (!c5 || bK) {
                    fn()
                }
                clearTimeout(eN);
                var fw = 0,
                    fx = function() {
                        if (fr.prevInput == "\u200b" && fr.input.selectionStart == 0) {
                            cx(fv, dW.selectAll)(fv)
                        } else {
                            if (fw++ < 10) {
                                eN = setTimeout(fx, 500)
                            } else {
                                eC(fv)
                            }
                        }
                    };
                eN = setTimeout(fx, 200)
            }
        }
        if (c5 && !bK) {
            fn()
        }
        if (fd) {
            dJ(fp);
            var fm = function() {
                dw(window, "mouseup", fm);
                setTimeout(fs, 20)
            };
            bz(window, "mouseup", fm)
        } else {
            setTimeout(fs, 50)
        }
    }

    function cL(fl, fm) {
        if (!ev(fl, "gutterContextMenu")) {
            return false
        }
        return fj(fl, fm, "gutterContextMenu", false, ao)
    }
    var cs = C.changeEnd = function(fl) {
        if (!fl.text) {
            return fl.to
        }
        return O(fl.from.line + fl.text.length - 1, eR(fl.text).length + (fl.text.length == 1 ? fl.from.ch : 0))
    };

    function bB(fo, fn) {
        if (bR(fo, fn.from) < 0) {
            return fo
        }
        if (bR(fo, fn.to) <= 0) {
            return cs(fn)
        }
        var fl = fo.line + fn.text.length - (fn.to.line - fn.from.line) - 1,
            fm = fo.ch;
        if (fo.line == fn.to.line) {
            fm += cs(fn).ch - fn.to.ch
        }
        return O(fl, fm)
    }

    function ex(fo, fp) {
        var fm = [];
        for (var fn = 0; fn < fo.sel.ranges.length; fn++) {
            var fl = fo.sel.ranges[fn];
            fm.push(new di(bB(fl.anchor, fp), bB(fl.head, fp)))
        }
        return b8(fm, fo.sel.primIndex)
    }

    function a9(fn, fm, fl) {
        if (fn.line == fm.line) {
            return O(fl.line, fn.ch - fm.ch + fl.ch)
        } else {
            return O(fl.line + (fn.line - fm.line), fn.ch)
        }
    }

    function U(fv, fs, fm) {
        var fn = [];
        var fl = O(fv.first, 0),
            fw = fl;
        for (var fp = 0; fp < fs.length; fp++) {
            var fr = fs[fp];
            var fu = a9(fr.from, fl, fw);
            var ft = a9(cs(fr), fl, fw);
            fl = fr.to;
            fw = ft;
            if (fm == "around") {
                var fq = fv.sel.ranges[fp],
                    fo = bR(fq.head, fq.anchor) < 0;
                fn[fp] = new di(fo ? ft : fu, fo ? fu : ft)
            } else {
                fn[fp] = new di(fu, fu)
            }
        }
        return new e6(fn, fv.sel.primIndex)
    }

    function dc(fm, fo, fn) {
        var fl = {
            canceled: false,
            from: fo.from,
            to: fo.to,
            text: fo.text,
            origin: fo.origin,
            cancel: function() {
                this.canceled = true
            }
        };
        if (fn) {
            fl.update = function(fs, fr, fq, fp) {
                if (fs) {
                    this.from = eT(fm, fs)
                }
                if (fr) {
                    this.to = eT(fm, fr)
                }
                if (fq) {
                    this.text = fq
                }
                if (fp !== undefined) {
                    this.origin = fp
                }
            }
        }
        ao(fm, "beforeChange", fm, fl);
        if (fm.cm) {
            ao(fm.cm, "beforeChange", fm.cm, fl)
        }
        if (fl.canceled) {
            return null
        }
        return {
            from: fl.from,
            to: fl.to,
            text: fl.text,
            origin: fl.origin
        }
    }

    function aV(fo, fp, fn) {
        if (fo.cm) {
            if (!fo.cm.curOp) {
                return cx(fo.cm, aV)(fo, fp, fn)
            }
            if (fo.cm.state.suppressEdits) {
                return
            }
        }
        if (ev(fo, "beforeChange") || fo.cm && ev(fo.cm, "beforeChange")) {
            fp = dc(fo, fp, true);
            if (!fp) {
                return
            }
        }
        var fm = ff && !fn && ch(fo, fp.from, fp.to);
        if (fm) {
            for (var fl = fm.length - 1; fl >= 0;
                --fl) {
                F(fo, {
                    from: fm[fl].from,
                    to: fm[fl].to,
                    text: fl ? [""] : fp.text
                })
            }
        } else {
            F(fo, fp)
        }
    }

    function F(fn, fo) {
        if (fo.text.length == 1 && fo.text[0] == "" && bR(fo.from, fo.to) == 0) {
            return
        }
        var fm = ex(fn, fo);
        eW(fn, fo, fm, fn.cm ? fn.cm.curOp.id : NaN);
        dx(fn, fo, fm, dD(fn, fo));
        var fl = [];
        dr(fn, function(fq, fp) {
            if (!fp && cM(fl, fq.history) == -1) {
                c2(fq.history, fo);
                fl.push(fq.history)
            }
            dx(fq, fo, null, dD(fq, fo))
        })
    }

    function bI(fw, fu, fy) {
        if (fw.cm && fw.cm.state.suppressEdits) {
            return
        }
        var ft = fw.history,
            fn, fp = fw.sel;
        var fl = fu == "undo" ? ft.done : ft.undone,
            fx = fu == "undo" ? ft.undone : ft.done;
        for (var fq = 0; fq < fl.length; fq++) {
            if (fy || !fl[fq].ranges) {
                break
            }
        }
        if (fq == fl.length) {
            return
        }
        cz(fw, fx);
        for (;;) {
            fn = fl.pop();
            if (fn.ranges) {
                fx.push(fn);
                if (fy && !fn.equals(fw.sel)) {
                    ft.pendingSelection = fn;
                    return dH(fw, fn)
                }
                fp = fn
            } else {
                break
            }
        }
        var fs = [];
        cn(fp, fx);
        fx.push({
            changes: fs,
            generation: ft.generation
        });
        ft.generation = fn.generation || ++ft.maxGeneration;
        var fo = ev(fw, "beforeChange") || fw.cm && ev(fw.cm, "beforeChange");
        for (var fq = fn.changes.length - 1; fq >= 0;
            --fq) {
            var fv = fn.changes[fq];
            fv.origin = fu;
            if (fo && !dc(fw, fv, false)) {
                fl.length = 0;
                return
            }
            fs.push(cU(fw, fv));
            var fm = fq ? ex(fw, fv, null) : eR(fl);
            dx(fw, fv, fm, dt(fw, fv));
            var fr = [];
            dr(fw, function(fA, fz) {
                if (!fz && cM(fr, fA.history) == -1) {
                    c2(fA.history, fv);
                    fr.push(fA.history)
                }
                dx(fA, fv, null, dt(fA, fv))
            })
        }
    }

    function eA(fl, fm) {
        fl.first += fm;
        fl.sel = new e6(bu(fl.sel.ranges, function(fn) {
            return new di(O(fn.anchor.line + fm, fn.anchor.ch), O(fn.head.line + fm, fn.head.ch))
        }), fl.sel.primIndex);
        if (fl.cm) {
            W(fl.cm, fl.first, fl.first, fm)
        }
    }

    function dx(fp, fq, fo, fm) {
        if (fp.cm && !fp.cm.curOp) {
            return cx(fp.cm, dx)(fp, fq, fo, fm)
        }
        if (fq.to.line < fp.first) {
            eA(fp, fq.text.length - 1 - (fq.to.line - fq.from.line));
            return
        }
        if (fq.from.line > fp.lastLine()) {
            return
        }
        if (fq.from.line < fp.first) {
            var fl = fq.text.length - 1 - (fp.first - fq.from.line);
            eA(fp, fl);
            fq = {
                from: O(fp.first, 0),
                to: O(fq.to.line + fl, fq.to.ch),
                text: [eR(fq.text)],
                origin: fq.origin
            }
        }
        var fn = fp.lastLine();
        if (fq.to.line > fn) {
            fq = {
                from: fq.from,
                to: O(fn, es(fp, fn).text.length),
                text: [fq.text[0]],
                origin: fq.origin
            }
        }
        fq.removed = e7(fp, fq.from, fq.to);
        if (!fo) {
            fo = ex(fp, fq, null)
        }
        if (fp.cm) {
            at(fp.cm, fq, fm)
        } else {
            eL(fp, fq, fm)
        }
        bw(fp, fo, false)
    }

    function at(ft, fp, fn) {
        var fs = ft.doc,
            fo = ft.display,
            fq = fp.from,
            fr = fp.to;
        var fl = false,
            fm = fq.line;
        if (!ft.options.lineWrapping) {
            fm = bp(u(es(fs, fq.line)));
            fs.iter(fm, fr.line + 1, function(fv) {
                if (fv == fo.maxLine) {
                    fl = true;
                    return true
                }
            })
        }
        if (fs.sel.contains(fp.from, fp.to) > -1) {
            ft.curOp.cursorActivity = true
        }
        eL(fs, fp, fn, aT(ft));
        if (!ft.options.lineWrapping) {
            fs.iter(fm, fq.line + fp.text.length, function(fw) {
                var fv = dF(fw);
                if (fv > fo.maxLineLength) {
                    fo.maxLine = fw;
                    fo.maxLineLength = fv;
                    fo.maxLineChanged = true;
                    fl = false
                }
            });
            if (fl) {
                ft.curOp.updateMaxLine = true
            }
        }
        fs.frontier = Math.min(fs.frontier, fq.line);
        dy(ft, 400);
        var fu = fp.text.length - (fr.line - fq.line) - 1;
        if (fq.line == fr.line && fp.text.length == 1 && !dd(ft.doc, fp)) {
            L(ft, fq.line, "text")
        } else {
            W(ft, fq.line, fr.line + 1, fu)
        }
        if (ev(ft, "change")) {
            (ft.curOp.changeObjs || (ft.curOp.changeObjs = [])).push({
                from: fq,
                to: fr,
                text: fp.text,
                removed: fp.removed,
                origin: fp.origin
            })
        }
    }

    function aH(fo, fn, fq, fp, fl) {
        if (!fp) {
            fp = fq
        }
        if (bR(fp, fq) < 0) {
            var fm = fp;
            fp = fq;
            fq = fm
        }
        if (typeof fn == "string") {
            fn = aG(fn)
        }
        aV(fo, {
            from: fq,
            to: fp,
            text: fn,
            origin: fl
        })
    }

    function dq(fm, fp) {
        var fq = fm.display,
            fn = fq.sizer.getBoundingClientRect(),
            fl = null;
        if (fp.top + fn.top < 0) {
            fl = true
        } else {
            if (fp.bottom + fn.top > (window.innerHeight || document.documentElement.clientHeight)) {
                fl = false
            }
        }
        if (fl != null && !eH) {
            var fo = e5("div", "\u200b", null, "position: absolute; top: " + (fp.top - fq.viewOffset - el(fm.display)) + "px; height: " + (fp.bottom - fp.top + aZ) + "px; left: " + fp.left + "px; width: 2px;");
            fm.display.lineSpace.appendChild(fo);
            fo.scrollIntoView(fl);
            fm.display.lineSpace.removeChild(fo)
        }
    }

    function y(fu, fs, fp, fo) {
        if (fo == null) {
            fo = 0
        }
        for (;;) {
            var fq = false,
                ft = de(fu, fs);
            var fl = !fp || fp == fs ? ft : de(fu, fp);
            var fn = B(fu, Math.min(ft.left, fl.left), Math.min(ft.top, fl.top) - fo, Math.max(ft.left, fl.left), Math.max(ft.bottom, fl.bottom) + fo);
            var fr = fu.doc.scrollTop,
                fm = fu.doc.scrollLeft;
            if (fn.scrollTop != null) {
                H(fu, fn.scrollTop);
                if (Math.abs(fu.doc.scrollTop - fr) > 1) {
                    fq = true
                }
            }
            if (fn.scrollLeft != null) {
                bg(fu, fn.scrollLeft);
                if (Math.abs(fu.doc.scrollLeft - fm) > 1) {
                    fq = true
                }
            }
            if (!fq) {
                return ft
            }
        }
    }

    function z(fl, fn, fp, fm, fo) {
        var fq = B(fl, fn, fp, fm, fo);
        if (fq.scrollTop != null) {
            H(fl, fq.scrollTop)
        }
        if (fq.scrollLeft != null) {
            bg(fl, fq.scrollLeft)
        }
    }

    function B(fr, fz, fo, fy, fn) {
        var fw = fr.display,
            fv = aD(fr.display);
        if (fo < 0) {
            fo = 0
        }
        var fu = fr.curOp && fr.curOp.scrollTop != null ? fr.curOp.scrollTop : fw.scroller.scrollTop;
        var fm = fw.scroller.clientHeight - aZ,
            ft = {};
        var fB = fr.doc.height + bk(fw);
        var fC = fo < fv,
            fx = fn > fB - fv;
        if (fo < fu) {
            ft.scrollTop = fC ? 0 : fo
        } else {
            if (fn > fu + fm) {
                var fs = Math.min(fo, (fx ? fB : fn) - fm);
                if (fs != fu) {
                    ft.scrollTop = fs
                }
            }
        }
        var fl = fr.curOp && fr.curOp.scrollLeft != null ? fr.curOp.scrollLeft : fw.scroller.scrollLeft;
        var fq = fw.scroller.clientWidth - aZ;
        fz += fw.gutters.offsetWidth;
        fy += fw.gutters.offsetWidth;
        var fp = fw.gutters.offsetWidth;
        var fA = fz < fp + 10;
        if (fz < fl + fp || fA) {
            if (fA) {
                fz = 0
            }
            ft.scrollLeft = Math.max(0, fz - 10 - fp)
        } else {
            if (fy > fq + fl - 3) {
                ft.scrollLeft = fy + 10 - fq
            }
        }
        return ft
    }

    function cl(fl, fn, fm) {
        if (fn != null || fm != null) {
            eO(fl)
        }
        if (fn != null) {
            fl.curOp.scrollLeft = (fl.curOp.scrollLeft == null ? fl.doc.scrollLeft : fl.curOp.scrollLeft) + fn
        }
        if (fm != null) {
            fl.curOp.scrollTop = (fl.curOp.scrollTop == null ? fl.doc.scrollTop : fl.curOp.scrollTop) + fm
        }
    }

    function eQ(fl) {
        eO(fl);
        var fm = fl.getCursor();
        fl.curOp.scrollToPos = {
            from: fm,
            to: fm,
            margin: fl.options.cursorScrollMargin,
            isCursor: true
        }
    }

    function eO(fl) {
        var fn = fl.curOp.scrollToPos;
        if (fn) {
            fl.curOp.scrollToPos = null;
            var fp = c4(fl, fn.from),
                fo = c4(fl, fn.to);
            var fm = B(fl, Math.min(fp.left, fo.left), Math.min(fp.top, fo.top) - fn.margin, Math.max(fp.right, fo.right), Math.max(fp.bottom, fo.bottom) + fn.margin);
            fl.scrollTo(fm.scrollLeft, fm.scrollTop)
        }
    }

    function S(fy, fo, fx, fn) {
        var fw = fy.doc,
            fm;
        if (fx == null) {
            fx = "add"
        }
        if (fx == "smart") {
            if (!fy.doc.mode.indent) {
                fx = "prev"
            } else {
                fm = cZ(fy, fo)
            }
        }
        var fs = fy.options.tabSize;
        var fz = es(fw, fo),
            fr = bv(fz.text, null, fs);
        if (fz.stateAfter) {
            fz.stateAfter = null
        }
        var fl = fz.text.match(/^\s*/)[0],
            fu;
        if (!fn && !/\S/.test(fz.text)) {
            fu = 0;
            fx = "not"
        } else {
            if (fx == "smart") {
                fu = fy.doc.mode.indent(fm, fz.text.slice(fl.length), fz.text);
                if (fu == bL) {
                    if (!fn) {
                        return
                    }
                    fx = "prev"
                }
            }
        }
        if (fx == "prev") {
            if (fo > fw.first) {
                fu = bv(es(fw, fo - 1).text, null, fs)
            } else {
                fu = 0
            }
        } else {
            if (fx == "add") {
                fu = fr + fy.options.indentUnit
            } else {
                if (fx == "subtract") {
                    fu = fr - fy.options.indentUnit
                } else {
                    if (typeof fx == "number") {
                        fu = fr + fx
                    }
                }
            }
        }
        fu = Math.max(0, fu);
        var fv = "",
            ft = 0;
        if (fy.options.indentWithTabs) {
            for (var fp = Math.floor(fu / fs); fp;
                --fp) {
                ft += fs;
                fv += "\t"
            }
        }
        if (ft < fu) {
            fv += b1(fu - ft)
        }
        if (fv != fl) {
            aH(fy.doc, fv, O(fo, 0), O(fo, fl.length), "+input")
        } else {
            for (var fp = 0; fp < fw.sel.ranges.length; fp++) {
                var fq = fw.sel.ranges[fp];
                if (fq.head.line == fo && fq.head.ch < fl.length) {
                    var ft = O(fo, fl.length);
                    e(fw, fp, new di(ft, ft));
                    break
                }
            }
        }
        fz.stateAfter = null
    }

    function dR(fm, fo, fl, fr) {
        var fq = fo,
            fn = fo,
            fp = fm.doc;
        if (typeof fo == "number") {
            fn = es(fp, cA(fp, fo))
        } else {
            fq = bp(fo)
        }
        if (fq == null) {
            return null
        }
        if (fr(fn, fq)) {
            L(fm, fq, fl)
        } else {
            return null
        }
        return fn
    }

    function ee(fl, fr) {
        var fm = fl.doc.sel.ranges,
            fp = [];
        for (var fo = 0; fo < fm.length; fo++) {
            var fn = fr(fm[fo]);
            while (fp.length && bR(fn.from, eR(fp).to) <= 0) {
                var fq = fp.pop();
                if (bR(fq.from, fn.from) < 0) {
                    fn.from = fq.from;
                    break
                }
            }
            fp.push(fn)
        }
        cm(fl, function() {
            for (var fs = fp.length - 1; fs >= 0; fs--) {
                aH(fl.doc, "", fp[fs].from, fp[fs].to, "+delete")
            }
            eQ(fl)
        })
    }

    function bb(fC, fo, fw, fv, fq) {
        var ft = fo.line,
            fu = fo.ch,
            fB = fw;
        var fl = es(fC, ft);
        var fz = true;

        function fA() {
            var fD = ft + fw;
            if (fD < fC.first || fD >= fC.first + fC.size) {
                return (fz = false)
            }
            ft = fD;
            return fl = es(fC, fD)
        }

        function fy(fE) {
            var fD = (fq ? q : X)(fl, fu, fw, true);
            if (fD == null) {
                if (!fE && fA()) {
                    if (fq) {
                        fu = (fw < 0 ? cr : cf)(fl)
                    } else {
                        fu = fw < 0 ? fl.text.length : 0
                    }
                } else {
                    return (fz = false)
                }
            } else {
                fu = fD
            }
            return true
        }
        if (fv == "char") {
            fy()
        } else {
            if (fv == "column") {
                fy(true)
            } else {
                if (fv == "word" || fv == "group") {
                    var fx = null,
                        fr = fv == "group";
                    for (var fp = true;; fp = false) {
                        if (fw < 0 && !fy(!fp)) {
                            break
                        }
                        var fm = fl.text.charAt(fu) || "\n";
                        var fn = cb(fm) ? "w" : !fr ? null : /\s/.test(fm) ? null : "p";
                        if (fx && fx != fn) {
                            if (fw < 0) {
                                fw = 1;
                                fy()
                            }
                            break
                        }
                        if (fn) {
                            fx = fn
                        }
                        if (fw > 0 && !fy(!fp)) {
                            break
                        }
                    }
                }
            }
        }
        var fs = bx(fC, O(ft, fu), fB, true);
        if (!fz) {
            fs.hitSide = true
        }
        return fs
    }

    function a5(ft, fo, fl, fs) {
        var fr = ft.doc,
            fq = fo.left,
            fp;
        if (fs == "page") {
            var fn = Math.min(ft.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
            fp = fo.top + fl * (fn - (fl < 0 ? 1.5 : 0.5) * aD(ft.display))
        } else {
            if (fs == "line") {
                fp = fl > 0 ? fo.bottom + 3 : fo.top - 3
            }
        }
        for (;;) {
            var fm = eY(ft, fq, fp);
            if (!fm.outside) {
                break
            }
            if (fl < 0 ? fp <= 0 : fp >= fr.height) {
                fm.hitSide = true;
                break
            }
            fp += fl * 5
        }
        return fm
    }

    function ai(fo, fq) {
        var fp = fq.ch,
            fn = fq.ch;
        if (fo) {
            if ((fq.xRel < 0 || fn == fo.length) && fp) {
                --fp
            } else {
                ++fn
            }
            var fm = fo.charAt(fp);
            var fl = cb(fm) ? cb : /\s/.test(fm) ? function(fr) {
                return /\s/.test(fr)
            } : function(fr) {
                return !/\s/.test(fr) && !cb(fr)
            };
            while (fp > 0 && fl(fo.charAt(fp - 1))) {
                --fp
            }
            while (fn < fo.length && fl(fo.charAt(fn))) {
                ++fn
            }
        }
        return {
            from: O(fq.line, fp),
            to: O(fq.line, fn)
        }
    }
    C.prototype = {
        constructor: C,
        focus: function() {
            window.focus();
            dT(this);
            w(this)
        },
        setOption: function(fn, fo) {
            var fm = this.options,
                fl = fm[fn];
            if (fm[fn] == fo && fn != "mode") {
                return
            }
            fm[fn] = fo;
            if (aU.hasOwnProperty(fn)) {
                cx(this, aU[fn])(this, fo, fl)
            }
        },
        getOption: function(fl) {
            return this.options[fl]
        },
        getDoc: function() {
            return this.doc
        },
        addKeyMap: function(fm, fl) {
            this.state.keyMaps[fl ? "push" : "unshift"](fm)
        },
        removeKeyMap: function(fm) {
            var fn = this.state.keyMaps;
            for (var fl = 0; fl < fn.length;
                ++fl) {
                if (fn[fl] == fm || (typeof fn[fl] != "string" && fn[fl].name == fm)) {
                    fn.splice(fl, 1);
                    return true
                }
            }
        },
        addOverlay: cD(function(fl, fm) {
            var fn = fl.token ? fl : C.getMode(this.options, fl);
            if (fn.startState) {
                throw new Error("Overlays may not be stateful.")
            }
            this.state.overlays.push({
                mode: fn,
                modeSpec: fl,
                opaque: fm && fm.opaque
            });
            this.state.modeGen++;
            W(this)
        }),
        removeOverlay: cD(function(fl) {
            var fn = this.state.overlays;
            for (var fm = 0; fm < fn.length;
                ++fm) {
                var fo = fn[fm].modeSpec;
                if (fo == fl || typeof fl == "string" && fo.name == fl) {
                    fn.splice(fm, 1);
                    this.state.modeGen++;
                    W(this);
                    return
                }
            }
        }),
        indentLine: cD(function(fn, fl, fm) {
            if (typeof fl != "string" && typeof fl != "number") {
                if (fl == null) {
                    fl = this.options.smartIndent ? "smart" : "prev"
                } else {
                    fl = fl ? "add" : "subtract"
                }
            }
            if (bJ(this.doc, fn)) {
                S(this, fn, fl, fm)
            }
        }),
        indentSelection: cD(function(fq) {
            var fm = this.doc.sel.ranges,
                fl = -1;
            for (var fp = 0; fp < fm.length; fp++) {
                var fn = fm[fp];
                if (!fn.empty()) {
                    var fs = Math.max(fl, fn.from().line);
                    var fr = fn.to();
                    fl = Math.min(this.lastLine(), fr.line - (fr.ch ? 0 : 1)) + 1;
                    for (var fo = fs; fo < fl;
                        ++fo) {
                        S(this, fo, fq)
                    }
                } else {
                    if (fn.head.line > fl) {
                        S(this, fn.head.line, fq, true);
                        fl = fn.head.line;
                        if (fp == this.doc.sel.primIndex) {
                            eQ(this)
                        }
                    }
                }
            }
        }),
        getTokenAt: function(fs, fm) {
            var fp = this.doc;
            fs = eT(fp, fs);
            var fo = cZ(this, fs.line, fm),
                fr = this.doc.mode;
            var fl = es(fp, fs.line);
            var fq = new ea(fl.text, this.options.tabSize);
            while (fq.pos < fs.ch && !fq.eol()) {
                fq.start = fq.pos;
                var fn = fr.token(fq, fo)
            }
            return {
                start: fq.start,
                end: fq.pos,
                string: fq.current(),
                type: fn || null,
                state: fo
            }
        },
        getTokenTypeAt: function(fq) {
            fq = eT(this.doc, fq);
            var fn = cC(this, es(this.doc, fq.line));
            var fo = 0,
                fp = (fn.length - 1) / 2,
                fm = fq.ch;
            if (fm == 0) {
                return fn[2]
            }
            for (;;) {
                var fl = (fo + fp) >> 1;
                if ((fl ? fn[fl * 2 - 1] : 0) >= fm) {
                    fp = fl
                } else {
                    if (fn[fl * 2 + 1] < fm) {
                        fo = fl + 1
                    } else {
                        return fn[fl * 2 + 2]
                    }
                }
            }
        },
        getModeAt: function(fm) {
            var fl = this.doc.mode;
            if (!fl.innerMode) {
                return fl
            }
            return C.innerMode(fl, this.getTokenAt(fm).state).mode
        },
        getHelper: function(fm, fl) {
            return this.getHelpers(fm, fl)[0]
        },
        getHelpers: function(fs, fn) {
            var fo = [];
            if (!eB.hasOwnProperty(fn)) {
                return eB
            }
            var fl = eB[fn],
                fr = this.getModeAt(fs);
            if (typeof fr[fn] == "string") {
                if (fl[fr[fn]]) {
                    fo.push(fl[fr[fn]])
                }
            } else {
                if (fr[fn]) {
                    for (var fm = 0; fm < fr[fn].length; fm++) {
                        var fq = fl[fr[fn][fm]];
                        if (fq) {
                            fo.push(fq)
                        }
                    }
                } else {
                    if (fr.helperType && fl[fr.helperType]) {
                        fo.push(fl[fr.helperType])
                    } else {
                        if (fl[fr.name]) {
                            fo.push(fl[fr.name])
                        }
                    }
                }
            }
            for (var fm = 0; fm < fl._global.length; fm++) {
                var fp = fl._global[fm];
                if (fp.pred(fr, this) && cM(fo, fp.val) == -1) {
                    fo.push(fp.val)
                }
            }
            return fo
        },
        getStateAfter: function(fm, fl) {
            var fn = this.doc;
            fm = cA(fn, fm == null ? fn.first + fn.size - 1 : fm);
            return cZ(this, fm + 1, fl)
        },
        cursorCoords: function(fo, fm) {
            var fn, fl = this.doc.sel.primary();
            if (fo == null) {
                fn = fl.head
            } else {
                if (typeof fo == "object") {
                    fn = eT(this.doc, fo)
                } else {
                    fn = fo ? fl.from() : fl.to()
                }
            }
            return de(this, fn, fm || "page")
        },
        charCoords: function(fm, fl) {
            return cj(this, eT(this.doc, fm), fl || "page")
        },
        coordsChar: function(fl, fm) {
            fl = fh(this, fl, fm || "page");
            return eY(this, fl.left, fl.top)
        },
        lineAtHeight: function(fl, fm) {
            fl = fh(this, {
                top: fl,
                left: 0
            }, fm || "page").top;
            return bi(this.doc, fl + this.display.viewOffset)
        },
        heightAtLine: function(fm, fp) {
            var fl = false,
                fo = this.doc.first + this.doc.size - 1;
            if (fm < this.doc.first) {
                fm = this.doc.first
            } else {
                if (fm > fo) {
                    fm = fo;
                    fl = true
                }
            }
            var fn = es(this.doc, fm);
            return d7(this, es(this.doc, fm), {
                top: 0,
                left: 0
            }, fp || "page").top + (fl ? fn.height : 0)
        },
        defaultTextHeight: function() {
            return aD(this.display)
        },
        defaultCharWidth: function() {
            return c1(this.display)
        },
        setGutterMarker: cD(function(fl, fm, fn) {
            return dR(this, fl, "gutter", function(fo) {
                var fp = fo.gutterMarkers || (fo.gutterMarkers = {});
                fp[fm] = fn;
                if (!fn && eb(fp)) {
                    fo.gutterMarkers = null
                }
                return true
            })
        }),
        clearGutter: cD(function(fn) {
            var fl = this,
                fo = fl.doc,
                fm = fo.first;
            fo.iter(function(fp) {
                if (fp.gutterMarkers && fp.gutterMarkers[fn]) {
                    fp.gutterMarkers[fn] = null;
                    L(fl, fm, "gutter");
                    if (eb(fp.gutterMarkers)) {
                        fp.gutterMarkers = null
                    }
                }++fm
            })
        }),
        addLineClass: cD(function(fn, fm, fl) {
            return dR(this, fn, "class", function(fo) {
                var fp = fm == "text" ? "textClass" : fm == "background" ? "bgClass" : "wrapClass";
                if (!fo[fp]) {
                    fo[fp] = fl
                } else {
                    if (new RegExp("(?:^|\\s)" + fl + "(?:$|\\s)").test(fo[fp])) {
                        return false
                    } else {
                        fo[fp] += " " + fl
                    }
                }
                return true
            })
        }),
        removeLineClass: cD(function(fn, fm, fl) {
            return dR(this, fn, "class", function(fp) {
                var fs = fm == "text" ? "textClass" : fm == "background" ? "bgClass" : "wrapClass";
                var fr = fp[fs];
                if (!fr) {
                    return false
                } else {
                    if (fl == null) {
                        fp[fs] = null
                    } else {
                        var fq = fr.match(new RegExp("(?:^|\\s+)" + fl + "(?:$|\\s+)"));
                        if (!fq) {
                            return false
                        }
                        var fo = fq.index + fq[0].length;
                        fp[fs] = fr.slice(0, fq.index) + (!fq.index || fo == fr.length ? "" : " ") + fr.slice(fo) || null
                    }
                }
                return true
            })
        }),
        addLineWidget: cD(function(fn, fm, fl) {
            return bj(this, fn, fm, fl)
        }),
        removeLineWidget: function(fl) {
            fl.clear()
        },
        lineInfo: function(fl) {
            if (typeof fl == "number") {
                if (!bJ(this.doc, fl)) {
                    return null
                }
                var fm = fl;
                fl = es(this.doc, fl);
                if (!fl) {
                    return null
                }
            } else {
                var fm = bp(fl);
                if (fm == null) {
                    return null
                }
            }
            return {
                line: fm,
                handle: fl,
                text: fl.text,
                gutterMarkers: fl.gutterMarkers,
                textClass: fl.textClass,
                bgClass: fl.bgClass,
                wrapClass: fl.wrapClass,
                widgets: fl.widgets
            }
        },
        getViewport: function() {
            return {
                from: this.display.viewFrom,
                to: this.display.viewTo
            }
        },
        addWidget: function(fq, fn, fs, fo, fu) {
            var fp = this.display;
            fq = de(this, eT(this.doc, fq));
            var fr = fq.bottom,
                fm = fq.left;
            fn.style.position = "absolute";
            fp.sizer.appendChild(fn);
            if (fo == "over") {
                fr = fq.top
            } else {
                if (fo == "above" || fo == "near") {
                    var fl = Math.max(fp.wrapper.clientHeight, this.doc.height),
                        ft = Math.max(fp.sizer.clientWidth, fp.lineSpace.clientWidth);
                    if ((fo == "above" || fq.bottom + fn.offsetHeight > fl) && fq.top > fn.offsetHeight) {
                        fr = fq.top - fn.offsetHeight
                    } else {
                        if (fq.bottom + fn.offsetHeight <= fl) {
                            fr = fq.bottom
                        }
                    }
                    if (fm + fn.offsetWidth > ft) {
                        fm = ft - fn.offsetWidth
                    }
                }
            }
            fn.style.top = fr + "px";
            fn.style.left = fn.style.right = "";
            if (fu == "right") {
                fm = fp.sizer.clientWidth - fn.offsetWidth;
                fn.style.right = "0px"
            } else {
                if (fu == "left") {
                    fm = 0
                } else {
                    if (fu == "middle") {
                        fm = (fp.sizer.clientWidth - fn.offsetWidth) / 2
                    }
                }
                fn.style.left = fm + "px"
            }
            if (fs) {
                z(this, fm, fr, fm + fn.offsetWidth, fr + fn.offsetHeight)
            }
        },
        triggerOnKeyDown: cD(m),
        triggerOnKeyPress: cD(b9),
        triggerOnKeyUp: cD(aX),
        execCommand: function(fl) {
            if (dW.hasOwnProperty(fl)) {
                return dW[fl](this)
            }
        },
        findPosH: function(fr, fo, fp, fm) {
            var fl = 1;
            if (fo < 0) {
                fl = -1;
                fo = -fo
            }
            for (var fn = 0, fq = eT(this.doc, fr); fn < fo;
                ++fn) {
                fq = bb(this.doc, fq, fl, fp, fm);
                if (fq.hitSide) {
                    break
                }
            }
            return fq
        },
        moveH: cD(function(fm, fn) {
            var fl = this;
            fl.extendSelectionsBy(function(fo) {
                if (fl.display.shift || fl.doc.extend || fo.empty()) {
                    return bb(fl.doc, fo.head, fm, fn, fl.options.rtlMoveVisually)
                } else {
                    return fm < 0 ? fo.from() : fo.to()
                }
            })
        }),
        deleteH: cD(function(fl, fm) {
            var fn = this.doc.sel,
                fo = this.doc;
            if (fn.somethingSelected()) {
                fo.replaceSelection("", null, "+delete")
            } else {
                ee(this, function(fq) {
                    var fp = bb(fo, fq.head, fl, fm, false);
                    return fl < 0 ? {
                        from: fp,
                        to: fq.head
                    } : {
                        from: fq.head,
                        to: fp
                    }
                })
            }
        }),
        findPosV: function(fq, fn, fr, ft) {
            var fl = 1,
                fp = ft;
            if (fn < 0) {
                fl = -1;
                fn = -fn
            }
            for (var fm = 0, fs = eT(this.doc, fq); fm < fn;
                ++fm) {
                var fo = de(this, fs, "div");
                if (fp == null) {
                    fp = fo.left
                } else {
                    fo.left = fp
                }
                fs = a5(this, fo, fl, fr);
                if (fs.hitSide) {
                    break
                }
            }
            return fs
        },
        moveV: cD(function(fm, fo) {
            var fl = this,
                fq = this.doc,
                fp = [];
            var fr = !fl.display.shift && !fq.sel.extend && fq.sel.somethingSelected();
            fq.extendSelectionsBy(function(fs) {
                if (fr) {
                    return fm < 0 ? fs.from() : fs.to()
                }
                var fu = de(fl, fs.head, "div");
                if (fs.goalColumn != null) {
                    fu.left = fs.goalColumn
                }
                fp.push(fu.left);
                var ft = a5(fl, fu, fm, fo);
                if (fo == "page" && fs == fq.sel.primary()) {
                    cl(fl, null, cj(fl, ft, "div").top - fu.top)
                }
                return ft
            });
            if (fp.length) {
                for (var fn = 0; fn < fq.sel.ranges.length; fn++) {
                    fq.sel.ranges[fn].goalColumn = fp[fn]
                }
            }
        }),
        toggleOverwrite: function(fl) {
            if (fl != null && fl == this.state.overwrite) {
                return
            }
            if (this.state.overwrite = !this.state.overwrite) {
                this.display.cursorDiv.className += " CodeMirror-overwrite"
            } else {
                this.display.cursorDiv.className = this.display.cursorDiv.className.replace(" CodeMirror-overwrite", "")
            }
            ao(this, "overwriteToggle", this, this.state.overwrite)
        },
        hasFocus: function() {
            return c9() == this.display.input
        },
        scrollTo: cD(function(fl, fm) {
            if (fl != null || fm != null) {
                eO(this)
            }
            if (fl != null) {
                this.curOp.scrollLeft = fl
            }
            if (fm != null) {
                this.curOp.scrollTop = fm
            }
        }),
        getScrollInfo: function() {
            var fl = this.display.scroller,
                fm = aZ;
            return {
                left: fl.scrollLeft,
                top: fl.scrollTop,
                height: fl.scrollHeight - fm,
                width: fl.scrollWidth - fm,
                clientHeight: fl.clientHeight - fm,
                clientWidth: fl.clientWidth - fm
            }
        },
        scrollIntoView: cD(function(fm, fn) {
            if (fm == null) {
                fm = {
                    from: this.doc.sel.primary().head,
                    to: null
                }
            } else {
                if (typeof fm == "number") {
                    fm = {
                        from: O(fm, 0),
                        to: null
                    }
                } else {
                    if (fm.from == null) {
                        fm = {
                            from: fm,
                            to: null
                        }
                    }
                }
            }
            if (!fm.to) {
                fm.to = fm.from
            }
            fm.margin = fn || 0;
            if (fm.from.line != null) {
                eO(this);
                this.curOp.scrollToPos = fm
            } else {
                var fl = B(this, Math.min(fm.from.left, fm.to.left), Math.min(fm.from.top, fm.to.top) - fm.margin, Math.max(fm.from.right, fm.to.right), Math.max(fm.from.bottom, fm.to.bottom) + fm.margin);
                this.scrollTo(fl.scrollLeft, fl.scrollTop)
            }
        }),
        setSize: cD(function(fn, fl) {
            function fm(fo) {
                return typeof fo == "number" || /^\d+$/.test(String(fo)) ? fo + "px" : fo
            }
            if (fn != null) {
                this.display.wrapper.style.width = fm(fn)
            }
            if (fl != null) {
                this.display.wrapper.style.height = fm(fl)
            }
            if (this.options.lineWrapping) {
                av(this)
            }
            this.curOp.forceUpdate = true;
            ao(this, "refresh", this)
        }),
        operation: function(fl) {
            return cm(this, fl)
        },
        refresh: cD(function() {
            var fl = this.display.cachedTextHeight;
            W(this);
            Z(this);
            this.scrollTo(this.doc.scrollLeft, this.doc.scrollTop);
            if (fl == null || Math.abs(fl - aD(this.display)) > 0.5) {
                P(this)
            }
            ao(this, "refresh", this)
        }),
        swapDoc: cD(function(fm) {
            var fl = this.doc;
            fl.cm = null;
            du(this, fm);
            Z(this);
            eC(this);
            this.scrollTo(fm.scrollLeft, fm.scrollTop);
            T(this, "swapDoc", this, fl);
            return fl
        }),
        getInputField: function() {
            return this.display.input
        },
        getWrapperElement: function() {
            return this.display.wrapper
        },
        getScrollerElement: function() {
            return this.display.scroller
        },
        getGutterElement: function() {
            return this.display.gutters
        }
    };
    bd(C);
    var ej = C.defaults = {};
    var aU = C.optionHandlers = {};

    function o(fl, fo, fn, fm) {
        C.defaults[fl] = fo;
        if (fn) {
            aU[fl] = fm ? function(fp, fr, fq) {
                if (fq != bO) {
                    fn(fp, fr, fq)
                }
            } : fn
        }
    }
    var bO = C.Init = {
        toString: function() {
            return "CodeMirror.Init"
        }
    };
    o("value", "", function(fl, fm) {
        fl.setValue(fm)
    }, true);
    o("mode", null, function(fl, fm) {
        fl.doc.modeOption = fm;
        a6(fl)
    }, true);
    o("indentUnit", 2, a6, true);
    o("indentWithTabs", false);
    o("smartIndent", true);
    o("tabSize", 4, function(fl) {
        dE(fl);
        Z(fl);
        W(fl)
    }, true);
    o("specialChars", /[\t\u0000-\u0019\u00ad\u200b\u2028\u2029\ufeff]/g, function(fl, fm) {
        fl.options.specialChars = new RegExp(fm.source + (fm.test("\t") ? "" : "|\t"), "g");
        fl.refresh()
    }, true);
    o("specialCharPlaceholder", eq, function(fl) {
        fl.refresh()
    }, true);
    o("electricChars", true);
    o("rtlMoveVisually", !aw);
    o("wholeLineUpdateBefore", true);
    o("theme", "default", function(fl) {
        co(fl);
        cV(fl)
    }, true);
    o("keyMap", "default", fi);
    o("extraKeys", null);
    o("lineWrapping", false, dZ, true);
    o("gutters", [], function(fl) {
        bQ(fl.options);
        cV(fl)
    }, true);
    o("fixedGutter", true, function(fl, fm) {
        fl.display.gutters.style.left = fm ? dh(fl.display) + "px" : "0";
        fl.refresh()
    }, true);
    o("coverGutterNextToScrollbar", false, ef, true);
    o("lineNumbers", false, function(fl) {
        bQ(fl.options);
        cV(fl)
    }, true);
    o("firstLineNumber", 1, cV, true);
    o("lineNumberFormatter", function(fl) {
        return fl
    }, cV, true);
    o("showCursorWhenSelecting", false, bf, true);
    o("resetSelectionOnContextMenu", true);
    o("readOnly", false, function(fl, fm) {
        if (fm == "nocursor") {
            aA(fl);
            fl.display.input.blur();
            fl.display.disabled = true
        } else {
            fl.display.disabled = false;
            if (!fm) {
                eC(fl)
            }
        }
    });
    o("disableInput", false, function(fl, fm) {
        if (!fm) {
            eC(fl)
        }
    }, true);
    o("dragDrop", true);
    o("cursorBlinkRate", 530);
    o("cursorScrollMargin", 0);
    o("cursorHeight", 1);
    o("workTime", 100);
    o("workDelay", 100);
    o("flattenSpans", true, dE, true);
    o("addModeClass", false, dE, true);
    o("pollInterval", 100);
    o("undoDepth", 200, function(fl, fm) {
        fl.doc.history.undoDepth = fm
    });
    o("historyEventDelay", 500);
    o("historySelectionEventDelay", 1000);
    o("viewportMargin", 10, function(fl) {
        fl.refresh()
    }, true);
    o("maxHighlightLength", 10000, dE, true);
    o("moveInputWithCursor", true, function(fl, fm) {
        if (!fm) {
            fl.display.inputDiv.style.top = fl.display.inputDiv.style.left = 0
        }
    });
    o("tabindex", null, function(fl, fm) {
        fl.display.input.tabIndex = fm || ""
    });
    o("autofocus", null);
    var cS = C.modes = {},
        az = C.mimeModes = {};
    C.defineMode = function(fl, fn) {
        if (!C.defaults.mode && fl != "null") {
            C.defaults.mode = fl
        }
        if (arguments.length > 2) {
            fn.dependencies = [];
            for (var fm = 2; fm < arguments.length;
                ++fm) {
                fn.dependencies.push(arguments[fm])
            }
        }
        cS[fl] = fn
    };
    C.defineMIME = function(fm, fl) {
        az[fm] = fl
    };
    C.resolveMode = function(fl) {
        if (typeof fl == "string" && az.hasOwnProperty(fl)) {
            fl = az[fl]
        } else {
            if (fl && typeof fl.name == "string" && az.hasOwnProperty(fl.name)) {
                var fm = az[fl.name];
                fl = bW(fm, fl);
                fl.name = fm.name
            } else {
                if (typeof fl == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(fl)) {
                    return C.resolveMode("application/xml")
                }
            }
        }
        if (typeof fl == "string") {
            return {
                name: fl
            }
        } else {
            return fl || {
                name: "null"
            }
        }
    };
    C.getMode = function(fm, fl) {
        var fl = C.resolveMode(fl);
        var fo = cS[fl.name];
        if (!fo) {
            return C.getMode(fm, "text/plain")
        }
        var fp = fo(fm, fl);
        if (cP.hasOwnProperty(fl.name)) {
            var fn = cP[fl.name];
            for (var fq in fn) {
                if (!fn.hasOwnProperty(fq)) {
                    continue
                }
                if (fp.hasOwnProperty(fq)) {
                    fp["_" + fq] = fp[fq]
                }
                fp[fq] = fn[fq]
            }
        }
        fp.name = fl.name;
        if (fl.helperType) {
            fp.helperType = fl.helperType
        }
        if (fl.modeProps) {
            for (var fq in fl.modeProps) {
                fp[fq] = fl.modeProps[fq]
            }
        }
        return fp
    };
    C.defineMode("null", function() {
        return {
            token: function(fl) {
                fl.skipToEnd()
            }
        }
    });
    C.defineMIME("text/plain", "null");
    var cP = C.modeExtensions = {};
    C.extendMode = function(fn, fm) {
        var fl = cP.hasOwnProperty(fn) ? cP[fn] : (cP[fn] = {});
        au(fm, fl)
    };
    C.defineExtension = function(fl, fm) {
        C.prototype[fl] = fm
    };
    C.defineDocExtension = function(fl, fm) {
        ah.prototype[fl] = fm
    };
    C.defineOption = o;
    var aO = [];
    C.defineInitHook = function(fl) {
        aO.push(fl)
    };
    var eB = C.helpers = {};
    C.registerHelper = function(fm, fl, fn) {
        if (!eB.hasOwnProperty(fm)) {
            eB[fm] = C[fm] = {
                _global: []
            }
        }
        eB[fm][fl] = fn
    };
    C.registerGlobalHelper = function(fn, fm, fl, fo) {
        C.registerHelper(fn, fm, fo);
        eB[fn]._global.push({
            pred: fl,
            val: fo
        })
    };
    var bE = C.copyState = function(fo, fl) {
        if (fl === true) {
            return fl
        }
        if (fo.copyState) {
            return fo.copyState(fl)
        }
        var fn = {};
        for (var fp in fl) {
            var fm = fl[fp];
            if (fm instanceof Array) {
                fm = fm.concat([])
            }
            fn[fp] = fm
        }
        return fn
    };
    var bC = C.startState = function(fn, fm, fl) {
        return fn.startState ? fn.startState(fm, fl) : true
    };
    C.innerMode = function(fn, fl) {
        while (fn.innerMode) {
            var fm = fn.innerMode(fl);
            if (!fm || fm.mode == fn) {
                break
            }
            fl = fm.state;
            fn = fm.mode
        }
        return fm || {
            mode: fn,
            state: fl
        }
    };
    var dW = C.commands = {
        selectAll: function(fl) {
            fl.setSelection(O(fl.firstLine(), 0), O(fl.lastLine()), false)
        },
        singleSelection: function(fl) {
            fl.setSelection(fl.getCursor("anchor"), fl.getCursor("head"), false)
        },
        killLine: function(fl) {
            ee(fl, function(fn) {
                if (fn.empty()) {
                    var fm = es(fl.doc, fn.head.line).text.length;
                    if (fn.head.ch == fm && fn.head.line < fl.lastLine()) {
                        return {
                            from: fn.head,
                            to: O(fn.head.line + 1, 0)
                        }
                    } else {
                        return {
                            from: fn.head,
                            to: O(fn.head.line, fm)
                        }
                    }
                } else {
                    return {
                        from: fn.from(),
                        to: fn.to()
                    }
                }
            })
        },
        deleteLine: function(fl) {
            ee(fl, function(fm) {
                return {
                    from: O(fm.from().line, 0),
                    to: eT(fl.doc, O(fm.to().line + 1, 0))
                }
            })
        },
        delLineLeft: function(fl) {
            ee(fl, function(fm) {
                return {
                    from: O(fm.from().line, 0),
                    to: fm.from()
                }
            })
        },
        undo: function(fl) {
            fl.undo()
        },
        redo: function(fl) {
            fl.redo()
        },
        undoSelection: function(fl) {
            fl.undoSelection()
        },
        redoSelection: function(fl) {
            fl.redoSelection()
        },
        goDocStart: function(fl) {
            fl.extendSelection(O(fl.firstLine(), 0))
        },
        goDocEnd: function(fl) {
            fl.extendSelection(O(fl.lastLine()))
        },
        goLineStart: function(fl) {
            fl.extendSelectionsBy(function(fm) {
                return a8(fl, fm.head.line)
            })
        },
        goLineStartSmart: function(fl) {
            fl.extendSelectionsBy(function(fo) {
                var fr = a8(fl, fo.head.line);
                var fn = fl.getLineHandle(fr.line);
                var fm = a(fn);
                if (!fm || fm[0].level == 0) {
                    var fq = Math.max(0, fn.text.search(/\S/));
                    var fp = fo.head.line == fr.line && fo.head.ch <= fq && fo.head.ch;
                    return O(fr.line, fp ? 0 : fq)
                }
                return fr
            })
        },
        goLineEnd: function(fl) {
            fl.extendSelectionsBy(function(fm) {
                return da(fl, fm.head.line)
            })
        },
        goLineRight: function(fl) {
            fl.extendSelectionsBy(function(fm) {
                var fn = fl.charCoords(fm.head, "div").top + 5;
                return fl.coordsChar({
                    left: fl.display.lineDiv.offsetWidth + 100,
                    top: fn
                }, "div")
            })
        },
        goLineLeft: function(fl) {
            fl.extendSelectionsBy(function(fm) {
                var fn = fl.charCoords(fm.head, "div").top + 5;
                return fl.coordsChar({
                    left: 0,
                    top: fn
                }, "div")
            })
        },
        goLineUp: function(fl) {
            fl.moveV(-1, "line")
        },
        goLineDown: function(fl) {
            fl.moveV(1, "line")
        },
        goPageUp: function(fl) {
            fl.moveV(-1, "page")
        },
        goPageDown: function(fl) {
            fl.moveV(1, "page")
        },
        goCharLeft: function(fl) {
            fl.moveH(-1, "char")
        },
        goCharRight: function(fl) {
            fl.moveH(1, "char")
        },
        goColumnLeft: function(fl) {
            fl.moveH(-1, "column")
        },
        goColumnRight: function(fl) {
            fl.moveH(1, "column")
        },
        goWordLeft: function(fl) {
            fl.moveH(-1, "word")
        },
        goGroupRight: function(fl) {
            fl.moveH(1, "group")
        },
        goGroupLeft: function(fl) {
            fl.moveH(-1, "group")
        },
        goWordRight: function(fl) {
            fl.moveH(1, "word")
        },
        delCharBefore: function(fl) {
            fl.deleteH(-1, "char")
        },
        delCharAfter: function(fl) {
            fl.deleteH(1, "char")
        },
        delWordBefore: function(fl) {
            fl.deleteH(-1, "word")
        },
        delWordAfter: function(fl) {
            fl.deleteH(1, "word")
        },
        delGroupBefore: function(fl) {
            fl.deleteH(-1, "group")
        },
        delGroupAfter: function(fl) {
            fl.deleteH(1, "group")
        },
        indentAuto: function(fl) {
            fl.indentSelection("smart")
        },
        indentMore: function(fl) {
            fl.indentSelection("add")
        },
        indentLess: function(fl) {
            fl.indentSelection("subtract")
        },
        insertTab: function(fl) {
            fl.replaceSelection("\t", null, "+input")
        },
        defaultTab: function(fl) {
            if (fl.somethingSelected()) {
                fl.indentSelection("add")
            } else {
                fl.replaceSelection("\t", null, "+input")
            }
        },
        transposeChars: function(fl) {
            cm(fl, function() {
                var fn = fl.listSelections();
                for (var fo = 0; fo < fn.length; fo++) {
                    var fp = fn[fo].head,
                        fm = es(fl.doc, fp.line);
                    if (fp.ch > 0 && fp.ch < fm.length - 1) {
                        fl.replaceRange(fm.charAt(fp.ch) + fm.charAt(fp.ch - 1), O(fp.line, fp.ch - 1), O(fp.line, fp.ch + 1))
                    }
                }
            })
        },
        newlineAndIndent: function(fl) {
            cm(fl, function() {
                var fm = fl.listSelections().length;
                for (var fo = 0; fo < fm; fo++) {
                    var fn = fl.listSelections()[fo];
                    fl.replaceRange("\n", fn.anchor, fn.head, "+input");
                    fl.indentLine(fn.from().line + 1, null, true);
                    eQ(fl)
                }
            })
        },
        toggleOverwrite: function(fl) {
            fl.toggleOverwrite()
        }
    };
    var en = C.keyMap = {};
    en.basic = {
        Left: "goCharLeft",
        Right: "goCharRight",
        Up: "goLineUp",
        Down: "goLineDown",
        End: "goLineEnd",
        Home: "goLineStartSmart",
        PageUp: "goPageUp",
        PageDown: "goPageDown",
        Delete: "delCharAfter",
        Backspace: "delCharBefore",
        "Shift-Backspace": "delCharBefore",
        Tab: "defaultTab",
        "Shift-Tab": "indentAuto",
        Enter: "newlineAndIndent",
        Insert: "toggleOverwrite",
        Esc: "singleSelection"
    };
    en.pcDefault = {
        "Ctrl-A": "selectAll",
        "Ctrl-D": "deleteLine",
        "Ctrl-Z": "undo",
        "Shift-Ctrl-Z": "redo",
        "Ctrl-Y": "redo",
        "Ctrl-Home": "goDocStart",
        "Ctrl-Up": "goDocStart",
        "Ctrl-End": "goDocEnd",
        "Ctrl-Down": "goDocEnd",
        "Ctrl-Left": "goGroupLeft",
        "Ctrl-Right": "goGroupRight",
        "Alt-Left": "goLineStart",
        "Alt-Right": "goLineEnd",
        "Ctrl-Backspace": "delGroupBefore",
        "Ctrl-Delete": "delGroupAfter",
        "Ctrl-S": "save",
        "Ctrl-F": "find",
        "Ctrl-G": "findNext",
        "Shift-Ctrl-G": "findPrev",
        "Shift-Ctrl-F": "replace",
        "Shift-Ctrl-R": "replaceAll",
        "Ctrl-[": "indentLess",
        "Ctrl-]": "indentMore",
        "Ctrl-U": "undoSelection",
        "Shift-Ctrl-U": "redoSelection",
        "Alt-U": "redoSelection",
        fallthrough: "basic"
    };
    en.macDefault = {
        "Cmd-A": "selectAll",
        "Cmd-D": "deleteLine",
        "Cmd-Z": "undo",
        "Shift-Cmd-Z": "redo",
        "Cmd-Y": "redo",
        "Cmd-Up": "goDocStart",
        "Cmd-End": "goDocEnd",
        "Cmd-Down": "goDocEnd",
        "Alt-Left": "goGroupLeft",
        "Alt-Right": "goGroupRight",
        "Cmd-Left": "goLineStart",
        "Cmd-Right": "goLineEnd",
        "Alt-Backspace": "delGroupBefore",
        "Ctrl-Alt-Backspace": "delGroupAfter",
        "Alt-Delete": "delGroupAfter",
        "Cmd-S": "save",
        "Cmd-F": "find",
        "Cmd-G": "findNext",
        "Shift-Cmd-G": "findPrev",
        "Cmd-Alt-F": "replace",
        "Shift-Cmd-Alt-F": "replaceAll",
        "Cmd-[": "indentLess",
        "Cmd-]": "indentMore",
        "Cmd-Backspace": "delLineLeft",
        "Cmd-U": "undoSelection",
        "Shift-Cmd-U": "redoSelection",
        fallthrough: ["basic", "emacsy"]
    };
    en.emacsy = {
        "Ctrl-F": "goCharRight",
        "Ctrl-B": "goCharLeft",
        "Ctrl-P": "goLineUp",
        "Ctrl-N": "goLineDown",
        "Alt-F": "goWordRight",
        "Alt-B": "goWordLeft",
        "Ctrl-A": "goLineStart",
        "Ctrl-E": "goLineEnd",
        "Ctrl-V": "goPageDown",
        "Shift-Ctrl-V": "goPageUp",
        "Ctrl-D": "delCharAfter",
        "Ctrl-H": "delCharBefore",
        "Alt-D": "delWordAfter",
        "Alt-Backspace": "delWordBefore",
        "Ctrl-K": "killLine",
        "Ctrl-T": "transposeChars"
    };
    en["default"] = bH ? en.macDefault : en.pcDefault;

    function e3(fl) {
        if (typeof fl == "string") {
            return en[fl]
        } else {
            return fl
        }
    }
    var g = C.lookupKey = function(fm, fq, fo) {
        function fp(fv) {
            fv = e3(fv);
            var fu = fv[fm];
            if (fu === false) {
                return "stop"
            }
            if (fu != null && fo(fu)) {
                return true
            }
            if (fv.nofallthrough) {
                return "stop"
            }
            var ft = fv.fallthrough;
            if (ft == null) {
                return false
            }
            if (Object.prototype.toString.call(ft) != "[object Array]") {
                return fp(ft)
            }
            for (var fs = 0; fs < ft.length;
                ++fs) {
                var fr = fp(ft[fs]);
                if (fr) {
                    return fr
                }
            }
            return false
        }
        for (var fn = 0; fn < fq.length;
            ++fn) {
            var fl = fp(fq[fn]);
            if (fl) {
                return fl != "stop"
            }
        }
    };
    var dV = C.isModifierKey = function(fm) {
        var fl = et[fm.keyCode];
        return fl == "Ctrl" || fl == "Alt" || fl == "Shift" || fl == "Mod"
    };
    var eE = C.keyName = function(fm, fn) {
        if (dl && fm.keyCode == 34 && fm["char"]) {
            return false
        }
        var fl = et[fm.keyCode];
        if (fl == null || fm.altGraphKey) {
            return false
        }
        if (fm.altKey) {
            fl = "Alt-" + fl
        }
        if (bs ? fm.metaKey : fm.ctrlKey) {
            fl = "Ctrl-" + fl
        }
        if (bs ? fm.ctrlKey : fm.metaKey) {
            fl = "Cmd-" + fl
        }
        if (!fn && fm.shiftKey) {
            fl = "Shift-" + fl
        }
        return fl
    };
    C.fromTextArea = function(fs, ft) {
        if (!ft) {
            ft = {}
        }
        ft.value = fs.value;
        if (!ft.tabindex && fs.tabindex) {
            ft.tabindex = fs.tabindex
        }
        if (!ft.placeholder && fs.placeholder) {
            ft.placeholder = fs.placeholder
        }
        if (ft.autofocus == null) {
            var fl = c9();
            ft.autofocus = fl == fs || fs.getAttribute("autofocus") != null && fl == document.body
        }

        function fp() {
            fs.value = fr.getValue()
        }
        if (fs.form) {
            bz(fs.form, "submit", fp);
            if (!ft.leaveSubmitMethodAlone) {
                var fm = fs.form,
                    fq = fm.submit;
                try {
                    var fo = fm.submit = function() {
                        fp();
                        fm.submit = fq;
                        fm.submit();
                        fm.submit = fo
                    }
                } catch (fn) {}
            }
        }
        fs.style.display = "none";
        var fr = C(function(fu) {
            fs.parentNode.insertBefore(fu, fs.nextSibling)
        }, ft);
        fr.save = fp;
        fr.getTextArea = function() {
            return fs
        };
        fr.toTextArea = function() {
            fp();
            fs.parentNode.removeChild(fr.getWrapperElement());
            fs.style.display = "";
            if (fs.form) {
                dw(fs.form, "submit", fp);
                if (typeof fs.form.submit == "function") {
                    fs.form.submit = fq
                }
            }
        };
        return fr
    };
    var ea = C.StringStream = function(fl, fm) {
        this.pos = this.start = 0;
        this.string = fl;
        this.tabSize = fm || 8;
        this.lastColumnPos = this.lastColumnValue = 0;
        this.lineStart = 0
    };
    ea.prototype = {
        eol: function() {
            return this.pos >= this.string.length
        },
        sol: function() {
            return this.pos == this.lineStart
        },
        peek: function() {
            return this.string.charAt(this.pos) || undefined
        },
        next: function() {
            if (this.pos < this.string.length) {
                return this.string.charAt(this.pos++)
            }
        },
        eat: function(fl) {
            var fn = this.string.charAt(this.pos);
            if (typeof fl == "string") {
                var fm = fn == fl
            } else {
                var fm = fn && (fl.test ? fl.test(fn) : fl(fn))
            }
            if (fm) {
                ++this.pos;
                return fn
            }
        },
        eatWhile: function(fl) {
            var fm = this.pos;
            while (this.eat(fl)) {}
            return this.pos > fm
        },
        eatSpace: function() {
            var fl = this.pos;
            while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) {
                ++this.pos
            }
            return this.pos > fl
        },
        skipToEnd: function() {
            this.pos = this.string.length
        },
        skipTo: function(fl) {
            var fm = this.string.indexOf(fl, this.pos);
            if (fm > -1) {
                this.pos = fm;
                return true
            }
        },
        backUp: function(fl) {
            this.pos -= fl
        },
        column: function() {
            if (this.lastColumnPos < this.start) {
                this.lastColumnValue = bv(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
                this.lastColumnPos = this.start
            }
            return this.lastColumnValue - (this.lineStart ? bv(this.string, this.lineStart, this.tabSize) : 0)
        },
        indentation: function() {
            return bv(this.string, null, this.tabSize) - (this.lineStart ? bv(this.string, this.lineStart, this.tabSize) : 0)
        },
        match: function(fp, fm, fl) {
            if (typeof fp == "string") {
                var fq = function(fr) {
                    return fl ? fr.toLowerCase() : fr
                };
                var fo = this.string.substr(this.pos, fp.length);
                if (fq(fo) == fq(fp)) {
                    if (fm !== false) {
                        this.pos += fp.length
                    }
                    return true
                }
            } else {
                var fn = this.string.slice(this.pos).match(fp);
                if (fn && fn.index > 0) {
                    return null
                }
                if (fn && fm !== false) {
                    this.pos += fn[0].length
                }
                return fn
            }
        },
        current: function() {
            return this.string.slice(this.start, this.pos)
        },
        hideFirstChars: function(fm, fl) {
            this.lineStart += fm;
            try {
                return fl()
            } finally {
                this.lineStart -= fm
            }
        }
    };
    var J = C.TextMarker = function(fm, fl) {
        this.lines = [];
        this.type = fl;
        this.doc = fm
    };
    bd(J);
    J.prototype.clear = function() {
        if (this.explicitlyCleared) {
            return
        }
        var fs = this.doc.cm,
            fm = fs && !fs.curOp;
        if (fm) {
            ci(fs)
        }
        if (ev(this, "clear")) {
            var ft = this.find();
            if (ft) {
                T(this, "clear", ft.from, ft.to)
            }
        }
        var fn = null,
            fq = null;
        for (var fo = 0; fo < this.lines.length;
            ++fo) {
            var fu = this.lines[fo];
            var fr = em(fu.markedSpans, this);
            if (fs && !this.collapsed) {
                L(fs, bp(fu), "text")
            } else {
                if (fs) {
                    if (fr.to != null) {
                        fq = bp(fu)
                    }
                    if (fr.from != null) {
                        fn = bp(fu)
                    }
                }
            }
            fu.markedSpans = d0(fu.markedSpans, fr);
            if (fr.from == null && this.collapsed && !eJ(this.doc, fu) && fs) {
                e9(fu, aD(fs.display))
            }
        }
        if (fs && this.collapsed && !fs.options.lineWrapping) {
            for (var fo = 0; fo < this.lines.length;
                ++fo) {
                var fl = u(this.lines[fo]),
                    fp = dF(fl);
                if (fp > fs.display.maxLineLength) {
                    fs.display.maxLine = fl;
                    fs.display.maxLineLength = fp;
                    fs.display.maxLineChanged = true
                }
            }
        }
        if (fn != null && fs && this.collapsed) {
            W(fs, fn, fq + 1)
        }
        this.lines.length = 0;
        this.explicitlyCleared = true;
        if (this.atomic && this.doc.cantEdit) {
            this.doc.cantEdit = false;
            if (fs) {
                dQ(fs.doc)
            }
        }
        if (fm) {
            ab(fs)
        }
    };
    J.prototype.find = function(fo, fm) {
        if (fo == null && this.type == "bookmark") {
            fo = 1
        }
        var fr, fq;
        for (var fn = 0; fn < this.lines.length;
            ++fn) {
            var fl = this.lines[fn];
            var fp = em(fl.markedSpans, this);
            if (fp.from != null) {
                fr = O(fm ? fl : bp(fl), fp.from);
                if (fo == -1) {
                    return fr
                }
            }
            if (fp.to != null) {
                fq = O(fm ? fl : bp(fl), fp.to);
                if (fo == 1) {
                    return fq
                }
            }
        }
        return fr && {
            from: fr,
            to: fq
        }
    };
    J.prototype.changed = function() {
        var fq = this.find(-1, true),
            fl = this.doc.cm;
        if (!fq || !fl) {
            return
        }
        var fn = fq.line,
            fp = bp(fq.line);
        var fm = eo(fl, fp);
        if (fm) {
            ag(fm)
        }
        if (fp >= fl.display.viewFrom && fp < fl.display.viewTo) {
            var fo = fl.display.view[cR(fl, fp)];
            if (!fo.hidden && fo.node && fo.node.offsetHeight != fn.height) {
                e9(fn, fo.node.offsetHeight)
            }
            cm(fl, function() {
                fl.curOp.selectionChanged = fl.curOp.forceUpdate = fl.curOp.updateMaxLine = true
            })
        }
    };
    J.prototype.attachLine = function(fl) {
        if (!this.lines.length && this.doc.cm) {
            var fm = this.doc.cm.curOp;
            if (!fm.maybeHiddenMarkers || cM(fm.maybeHiddenMarkers, this) == -1) {
                (fm.maybeUnhiddenMarkers || (fm.maybeUnhiddenMarkers = [])).push(this)
            }
        }
        this.lines.push(fl)
    };
    J.prototype.detachLine = function(fl) {
        this.lines.splice(cM(this.lines, fl), 1);
        if (!this.lines.length && this.doc.cm) {
            var fm = this.doc.cm.curOp;
            (fm.maybeHiddenMarkers || (fm.maybeHiddenMarkers = [])).push(this)
        }
    };
    var aL = 0;

    function dY(ft, fr, fs, fv, fp) {
        if (fv && fv.shared) {
            return I(ft, fr, fs, fv, fp)
        }
        if (ft.cm && !ft.cm.curOp) {
            return cx(ft.cm, dY)(ft, fr, fs, fv, fp)
        }
        var fo = new J(ft, fp),
            fu = bR(fr, fs);
        if (fv) {
            au(fv, fo)
        }
        if (fu > 0 || fu == 0 && fo.clearWhenEmpty !== false) {
            return fo
        }
        if (fo.replacedWith) {
            fo.collapsed = true;
            fo.widgetNode = e5("span", [fo.replacedWith], "CodeMirror-widget");
            if (!fv.handleMouseEvents) {
                fo.widgetNode.ignoreEvents = true
            }
            if (fv.insertLeft) {
                fo.widgetNode.insertLeft = true
            }
        }
        if (fo.collapsed) {
            if (v(ft, fr.line, fr, fs, fo) || fr.line != fs.line && v(ft, fs.line, fr, fs, fo)) {
                throw new Error("Inserting collapsed marker partially overlapping an existing one")
            }
            aN = true
        }
        if (fo.addToHistory) {
            eW(ft, {
                from: fr,
                to: fs,
                origin: "markText"
            }, ft.sel, NaN)
        }
        var fm = fr.line,
            fq = ft.cm,
            fl;
        ft.iter(fm, fs.line + 1, function(fw) {
            if (fq && fo.collapsed && !fq.options.lineWrapping && u(fw) == fq.display.maxLine) {
                fl = true
            }
            if (fo.collapsed && fm != fr.line) {
                e9(fw, 0)
            }
            bP(fw, new dB(fo, fm == fr.line ? fr.ch : null, fm == fs.line ? fs.ch : null));
            ++fm
        });
        if (fo.collapsed) {
            ft.iter(fr.line, fs.line + 1, function(fw) {
                if (eJ(ft, fw)) {
                    e9(fw, 0)
                }
            })
        }
        if (fo.clearOnEnter) {
            bz(fo, "beforeCursorEnter", function() {
                fo.clear()
            })
        }
        if (fo.readOnly) {
            ff = true;
            if (ft.history.done.length || ft.history.undone.length) {
                ft.clearHistory()
            }
        }
        if (fo.collapsed) {
            fo.id = ++aL;
            fo.atomic = true
        }
        if (fq) {
            if (fl) {
                fq.curOp.updateMaxLine = true
            }
            if (fo.collapsed) {
                W(fq, fr.line, fs.line + 1)
            } else {
                if (fo.className || fo.title || fo.startStyle || fo.endStyle) {
                    for (var fn = fr.line; fn <= fs.line; fn++) {
                        L(fq, fn, "text")
                    }
                }
            }
            if (fo.atomic) {
                dQ(fq.doc)
            }
        }
        return fo
    }
    var t = C.SharedTextMarker = function(fo, fm) {
        this.markers = fo;
        this.primary = fm;
        for (var fl = 0, fn = this; fl < fo.length;
            ++fl) {
            fo[fl].parent = this;
            bz(fo[fl], "clear", function() {
                fn.clear()
            })
        }
    };
    bd(t);
    t.prototype.clear = function() {
        if (this.explicitlyCleared) {
            return
        }
        this.explicitlyCleared = true;
        for (var fl = 0; fl < this.markers.length;
            ++fl) {
            this.markers[fl].clear()
        }
        T(this, "clear")
    };
    t.prototype.find = function(fm, fl) {
        return this.primary.find(fm, fl)
    };

    function I(fp, fs, fr, fl, fn) {
        fl = au(fl);
        fl.shared = false;
        var fq = [dY(fp, fs, fr, fl, fn)],
            fm = fq[0];
        var fo = fl.widgetNode;
        dr(fp, function(fu) {
            if (fo) {
                fl.widgetNode = fo.cloneNode(true)
            }
            fq.push(dY(fu, eT(fu, fs), eT(fu, fr), fl, fn));
            for (var ft = 0; ft < fu.linked.length;
                ++ft) {
                if (fu.linked[ft].isParent) {
                    return
                }
            }
            fm = eR(fq)
        });
        return new t(fq, fm)
    }

    function dB(fl, fn, fm) {
        this.marker = fl;
        this.from = fn;
        this.to = fm
    }

    function em(fn, fl) {
        if (fn) {
            for (var fm = 0; fm < fn.length;
                ++fm) {
                var fo = fn[fm];
                if (fo.marker == fl) {
                    return fo
                }
            }
        }
    }

    function d0(fm, fn) {
        for (var fo, fl = 0; fl < fm.length;
            ++fl) {
            if (fm[fl] != fn) {
                (fo || (fo = [])).push(fm[fl])
            }
        }
        return fo
    }

    function bP(fl, fm) {
        fl.markedSpans = fl.markedSpans ? fl.markedSpans.concat([fm]) : [fm];
        fm.marker.attachLine(fl)
    }

    function ax(fm, fn, fr) {
        if (fm) {
            for (var fp = 0, fs; fp < fm.length;
                ++fp) {
                var ft = fm[fp],
                    fq = ft.marker;
                var fl = ft.from == null || (fq.inclusiveLeft ? ft.from <= fn : ft.from < fn);
                if (fl || ft.from == fn && fq.type == "bookmark" && (!fr || !ft.marker.insertLeft)) {
                    var fo = ft.to == null || (fq.inclusiveRight ? ft.to >= fn : ft.to > fn);
                    (fs || (fs = [])).push(new dB(fq, ft.from, fo ? null : ft.to))
                }
            }
        }
        return fs
    }

    function am(fm, fo, fr) {
        if (fm) {
            for (var fp = 0, fs; fp < fm.length;
                ++fp) {
                var ft = fm[fp],
                    fq = ft.marker;
                var fn = ft.to == null || (fq.inclusiveRight ? ft.to >= fo : ft.to > fo);
                if (fn || ft.from == fo && fq.type == "bookmark" && (!fr || ft.marker.insertLeft)) {
                    var fl = ft.from == null || (fq.inclusiveLeft ? ft.from <= fo : ft.from < fo);
                    (fs || (fs = [])).push(new dB(fq, fl ? null : ft.from - fo, ft.to == null ? null : ft.to - fo))
                }
            }
        }
        return fs
    }

    function dD(fx, fu) {
        var ft = bJ(fx, fu.from.line) && es(fx, fu.from.line).markedSpans;
        var fA = bJ(fx, fu.to.line) && es(fx, fu.to.line).markedSpans;
        if (!ft && !fA) {
            return null
        }
        var fm = fu.from.ch,
            fp = fu.to.ch,
            fs = bR(fu.from, fu.to) == 0;
        var fr = ax(ft, fm, fs);
        var fz = am(fA, fp, fs);
        var fy = fu.text.length == 1,
            fn = eR(fu.text).length + (fy ? fm : 0);
        if (fr) {
            for (var fo = 0; fo < fr.length;
                ++fo) {
                var fw = fr[fo];
                if (fw.to == null) {
                    var fB = em(fz, fw.marker);
                    if (!fB) {
                        fw.to = fm
                    } else {
                        if (fy) {
                            fw.to = fB.to == null ? null : fB.to + fn
                        }
                    }
                }
            }
        }
        if (fz) {
            for (var fo = 0; fo < fz.length;
                ++fo) {
                var fw = fz[fo];
                if (fw.to != null) {
                    fw.to += fn
                }
                if (fw.from == null) {
                    var fB = em(fr, fw.marker);
                    if (!fB) {
                        fw.from = fn;
                        if (fy) {
                            (fr || (fr = [])).push(fw)
                        }
                    }
                } else {
                    fw.from += fn;
                    if (fy) {
                        (fr || (fr = [])).push(fw)
                    }
                }
            }
        }
        if (fr) {
            fr = n(fr)
        }
        if (fz && fz != fr) {
            fz = n(fz)
        }
        var fq = [fr];
        if (!fy) {
            var fv = fu.text.length - 2,
                fl;
            if (fv > 0 && fr) {
                for (var fo = 0; fo < fr.length;
                    ++fo) {
                    if (fr[fo].to == null) {
                        (fl || (fl = [])).push(new dB(fr[fo].marker, null, null))
                    }
                }
            }
            for (var fo = 0; fo < fv;
                ++fo) {
                fq.push(fl)
            }
            fq.push(fz)
        }
        return fq
    }

    function n(fm) {
        for (var fl = 0; fl < fm.length;
            ++fl) {
            var fn = fm[fl];
            if (fn.from != null && fn.from == fn.to && fn.marker.clearWhenEmpty !== false) {
                fm.splice(fl--, 1)
            }
        }
        if (!fm.length) {
            return null
        }
        return fm
    }

    function dt(ft, fr) {
        var fl = bF(ft, fr);
        var fu = dD(ft, fr);
        if (!fl) {
            return fu
        }
        if (!fu) {
            return fl
        }
        for (var fo = 0; fo < fl.length;
            ++fo) {
            var fp = fl[fo],
                fq = fu[fo];
            if (fp && fq) {
                spans: for (var fn = 0; fn < fq.length;
                    ++fn) {
                    var fs = fq[fn];
                    for (var fm = 0; fm < fp.length;
                        ++fm) {
                        if (fp[fm].marker == fs.marker) {
                            continue spans
                        }
                    }
                    fp.push(fs)
                }
            } else {
                if (fq) {
                    fl[fo] = fq
                }
            }
        }
        return fl
    }

    function ch(fx, fv, fw) {
        var fp = null;
        fx.iter(fv.line, fw.line + 1, function(fy) {
            if (fy.markedSpans) {
                for (var fz = 0; fz < fy.markedSpans.length;
                    ++fz) {
                    var fA = fy.markedSpans[fz].marker;
                    if (fA.readOnly && (!fp || cM(fp, fA) == -1)) {
                        (fp || (fp = [])).push(fA)
                    }
                }
            }
        });
        if (!fp) {
            return null
        }
        var fq = [{
            from: fv,
            to: fw
        }];
        for (var fr = 0; fr < fp.length;
            ++fr) {
            var fs = fp[fr],
                fn = fs.find(0);
            for (var fo = 0; fo < fq.length;
                ++fo) {
                var fm = fq[fo];
                if (bR(fm.to, fn.from) < 0 || bR(fm.from, fn.to) > 0) {
                    continue
                }
                var fu = [fo, 1],
                    fl = bR(fm.from, fn.from),
                    ft = bR(fm.to, fn.to);
                if (fl < 0 || !fs.inclusiveLeft && !fl) {
                    fu.push({
                        from: fm.from,
                        to: fn.from
                    })
                }
                if (ft > 0 || !fs.inclusiveRight && !ft) {
                    fu.push({
                        from: fn.to,
                        to: fm.to
                    })
                }
                fq.splice.apply(fq, fu);
                fo += fu.length - 1
            }
        }
        return fq
    }

    function fc(fl) {
        var fn = fl.markedSpans;
        if (!fn) {
            return
        }
        for (var fm = 0; fm < fn.length;
            ++fm) {
            fn[fm].marker.detachLine(fl)
        }
        fl.markedSpans = null
    }

    function cy(fl, fn) {
        if (!fn) {
            return
        }
        for (var fm = 0; fm < fn.length;
            ++fm) {
            fn[fm].marker.attachLine(fl)
        }
        fl.markedSpans = fn
    }

    function r(fl) {
        return fl.inclusiveLeft ? -1 : 0
    }

    function by(fl) {
        return fl.inclusiveRight ? 1 : 0
    }

    function db(fo, fm) {
        var fq = fo.lines.length - fm.lines.length;
        if (fq != 0) {
            return fq
        }
        var fn = fo.find(),
            fr = fm.find();
        var fl = bR(fn.from, fr.from) || r(fo) - r(fm);
        if (fl) {
            return -fl
        }
        var fp = bR(fn.to, fr.to) || by(fo) - by(fm);
        if (fp) {
            return fp
        }
        return fm.id - fo.id
    }

    function aM(fm, fq) {
        var fl = aN && fm.markedSpans,
            fp;
        if (fl) {
            for (var fo, fn = 0; fn < fl.length;
                ++fn) {
                fo = fl[fn];
                if (fo.marker.collapsed && (fq ? fo.from : fo.to) == null && (!fp || db(fp, fo.marker) < 0)) {
                    fp = fo.marker
                }
            }
        }
        return fp
    }

    function d6(fl) {
        return aM(fl, true)
    }

    function dN(fl) {
        return aM(fl, false)
    }

    function v(ft, fn, fr, fs, fp) {
        var fw = es(ft, fn);
        var fl = aN && fw.markedSpans;
        if (fl) {
            for (var fo = 0; fo < fl.length;
                ++fo) {
                var fm = fl[fo];
                if (!fm.marker.collapsed) {
                    continue
                }
                var fv = fm.marker.find(0);
                var fu = bR(fv.from, fr) || r(fm.marker) - r(fp);
                var fq = bR(fv.to, fs) || by(fm.marker) - by(fp);
                if (fu >= 0 && fq <= 0 || fu <= 0 && fq >= 0) {
                    continue
                }
                if (fu <= 0 && (bR(fv.to, fr) || by(fm.marker) - r(fp)) > 0 || fu >= 0 && (bR(fv.from, fs) || r(fm.marker) - by(fp)) < 0) {
                    return true
                }
            }
        }
    }

    function u(fm) {
        var fl;
        while (fl = d6(fm)) {
            fm = fl.find(-1, true).line
        }
        return fm
    }

    function f(fn) {
        var fl, fm;
        while (fl = dN(fn)) {
            fn = fl.find(1, true).line;
            (fm || (fm = [])).push(fn)
        }
        return fm
    }

    function aB(fo, fm) {
        var fl = es(fo, fm),
            fn = u(fl);
        if (fl == fn) {
            return fm
        }
        return bp(fn)
    }

    function dm(fo, fn) {
        if (fn > fo.lastLine()) {
            return fn
        }
        var fm = es(fo, fn),
            fl;
        if (!eJ(fo, fm)) {
            return fn
        }
        while (fl = dN(fm)) {
            fm = fl.find(1, true).line
        }
        return bp(fm) + 1
    }

    function eJ(fp, fm) {
        var fl = aN && fm.markedSpans;
        if (fl) {
            for (var fo, fn = 0; fn < fl.length;
                ++fn) {
                fo = fl[fn];
                if (!fo.marker.collapsed) {
                    continue
                }
                if (fo.from == null) {
                    return true
                }
                if (fo.marker.widgetNode) {
                    continue
                }
                if (fo.from == 0 && fo.marker.inclusiveLeft && M(fp, fm, fo)) {
                    return true
                }
            }
        }
    }

    function M(fq, fm, fo) {
        if (fo.to == null) {
            var fl = fo.marker.find(1, true);
            return M(fq, fl.line, em(fl.line.markedSpans, fo.marker))
        }
        if (fo.marker.inclusiveRight && fo.to == fm.text.length) {
            return true
        }
        for (var fp, fn = 0; fn < fm.markedSpans.length;
            ++fn) {
            fp = fm.markedSpans[fn];
            if (fp.marker.collapsed && !fp.marker.widgetNode && fp.from == fo.to && (fp.to == null || fp.to != fo.from) && (fp.marker.inclusiveLeft || fo.marker.inclusiveRight) && M(fq, fm, fp)) {
                return true
            }
        }
    }
    var c0 = C.LineWidget = function(fl, fo, fm) {
        if (fm) {
            for (var fn in fm) {
                if (fm.hasOwnProperty(fn)) {
                    this[fn] = fm[fn]
                }
            }
        }
        this.cm = fl;
        this.node = fo
    };
    bd(c0);
    c0.prototype.clear = function() {
        var fm = this.cm,
            fn = this.line.widgets,
            fp = bp(this.line);
        if (fp == null || !fn) {
            return
        }
        for (var fo = 0; fo < fn.length;
            ++fo) {
            if (fn[fo] == this) {
                fn.splice(fo--, 1)
            }
        }
        if (!fn.length) {
            this.line.widgets = null
        }
        var fl = bo(this.line) < fm.doc.scrollTop;
        e9(this.line, Math.max(0, this.line.height - ct(this)));
        if (fl) {
            cl(fm, null, -this.height)
        }
        cm(fm, function() {
            L(fm, fp, "widget")
        })
    };
    c0.prototype.changed = function() {
        var fm = this.height,
            fl = this.cm;
        this.height = null;
        var fn = ct(this) - fm;
        if (!fn) {
            return
        }
        e9(this.line, this.line.height + fn);
        var fo = bp(this.line);
        cm(fl, function() {
            L(fl, fo, "widget")
        })
    };

    function ct(fl) {
        if (fl.height != null) {
            return fl.height
        }
        if (!fl.node.parentNode || fl.node.parentNode.nodeType != 1) {
            bt(fl.cm.display.measure, e5("div", [fl.node], null, "position: relative"))
        }
        return fl.height = fl.node.offsetHeight
    }

    function bj(fl, fp, fn, fm) {
        var fo = new c0(fl, fn, fm);
        if (fo.noHScroll) {
            fl.display.alignWidgets = true
        }
        dR(fl, fp, "widget", function(fr) {
            var fs = fr.widgets || (fr.widgets = []);
            if (fo.insertAt == null) {
                fs.push(fo)
            } else {
                fs.splice(Math.min(fs.length - 1, Math.max(0, fo.insertAt)), 0, fo)
            }
            fo.line = fr;
            if (!eJ(fl.doc, fr) || fo.showIfHidden) {
                var fq = bo(fr) < fl.doc.scrollTop;
                e9(fr, fr.height + ct(fo));
                if (fq) {
                    cl(fl, null, fo.height)
                }
            }
            return true
        });
        return fo
    }
    var fb = C.Line = function(fn, fm, fl) {
        this.text = fn;
        cy(this, fm);
        this.height = fl ? fl(this) : 1
    };
    bd(fb);
    fb.prototype.lineNo = function() {
        return bp(this)
    };

    function dG(fm, fp, fn, fl) {
        fm.text = fp;
        if (fm.stateAfter) {
            fm.stateAfter = null
        }
        if (fm.styles) {
            fm.styles = null
        }
        if (fm.order != null) {
            fm.order = null
        }
        fc(fm);
        cy(fm, fn);
        var fo = fl ? fl(fm) : 1;
        if (fo != fm.height) {
            e9(fm, fo)
        }
    }

    function be(fl) {
        fl.parent = null;
        fc(fl)
    }

    function s(fu, fw, fp, fm, fq, fo) {
        var fn = fp.flattenSpans;
        if (fn == null) {
            fn = fu.options.flattenSpans
        }
        var fs = 0,
            fr = null;
        var fv = new ea(fw, fu.options.tabSize),
            fl;
        if (fw == "" && fp.blankLine) {
            fp.blankLine(fm)
        }
        while (!fv.eol()) {
            if (fv.pos > fu.options.maxHighlightLength) {
                fn = false;
                if (fo) {
                    cW(fu, fw, fm, fv.pos)
                }
                fv.pos = fw.length;
                fl = null
            } else {
                fl = fp.token(fv, fm)
            }
            if (fu.options.addModeClass) {
                var fx = C.innerMode(fp, fm).mode.name;
                if (fx) {
                    fl = "m-" + (fl ? fx + " " + fl : fx)
                }
            }
            if (!fn || fr != fl) {
                if (fs < fv.start) {
                    fq(fv.start, fr)
                }
                fs = fv.start;
                fr = fl
            }
            fv.start = fv.pos
        }
        while (fs < fv.pos) {
            var ft = Math.min(fv.pos, fs + 50000);
            fq(ft, fr);
            fs = ft
        }
    }

    function eM(fr, ft, fl, fo) {
        var fs = [fr.state.modeGen];
        s(fr, ft.text, fr.doc.mode, fl, function(fu, fv) {
            fs.push(fu, fv)
        }, fo);
        for (var fm = 0; fm < fr.state.overlays.length;
            ++fm) {
            var fp = fr.state.overlays[fm],
                fq = 1,
                fn = 0;
            s(fr, ft.text, fp.mode, true, function(fu, fw) {
                var fy = fq;
                while (fn < fu) {
                    var fv = fs[fq];
                    if (fv > fu) {
                        fs.splice(fq, 1, fu, fs[fq + 1], fv)
                    }
                    fq += 2;
                    fn = Math.min(fu, fv)
                }
                if (!fw) {
                    return
                }
                if (fp.opaque) {
                    fs.splice(fy, fq - fy, fu, fw);
                    fq = fy + 2
                } else {
                    for (; fy < fq; fy += 2) {
                        var fx = fs[fy + 1];
                        fs[fy + 1] = fx ? fx + " " + fw : fw
                    }
                }
            })
        }
        return fs
    }

    function cC(fl, fm) {
        if (!fm.styles || fm.styles[0] != fl.state.modeGen) {
            fm.styles = eM(fl, fm, fm.stateAfter = cZ(fl, bp(fm)))
        }
        return fm.styles
    }

    function cW(fl, fq, fn, fm) {
        var fp = fl.doc.mode;
        var fo = new ea(fq, fl.options.tabSize);
        fo.start = fo.pos = fm || 0;
        if (fq == "" && fp.blankLine) {
            fp.blankLine(fn)
        }
        while (!fo.eol() && fo.pos <= fl.options.maxHighlightLength) {
            fp.token(fo, fn);
            fo.start = fo.pos
        }
    }
    var dg = {},
        bD = {};

    function ed(fo, fn) {
        if (!fo) {
            return null
        }
        for (;;) {
            var fm = fo.match(/(?:^|\s+)line-(background-)?(\S+)/);
            if (!fm) {
                break
            }
            fo = fo.slice(0, fm.index) + fo.slice(fm.index + fm[0].length);
            var fp = fm[1] ? "bgClass" : "textClass";
            if (fn[fp] == null) {
                fn[fp] = fm[2]
            } else {
                if (!(new RegExp("(?:^|s)" + fm[2] + "(?:$|s)")).test(fn[fp])) {
                    fn[fp] += " " + fm[2]
                }
            }
        }
        if (/^\s*$/.test(fo)) {
            return null
        }
        var fl = fn.cm.options.addModeClass ? bD : dg;
        return fl[fo] || (fl[fo] = fo.replace(/\S+/g, "cm-$&"))
    }

    function d9(fm, fq) {
        var fr = e5("span", null, null, cv ? "padding-right: .1px" : null);
        var fo = {
            pre: e5("pre", [fr]),
            content: fr,
            col: 0,
            pos: 0,
            cm: fm
        };
        fq.measure = {};
        for (var fp = 0; fp <= (fq.rest ? fq.rest.length : 0); fp++) {
            var fn = fp ? fq.rest[fp - 1] : fq.line,
                fl;
            fo.pos = 0;
            fo.addToken = p;
            if ((c5 || cv) && fm.getOption("lineWrapping")) {
                fo.addToken = eP(fo.addToken)
            }
            if (bq(fm.display.measure) && (fl = a(fn))) {
                fo.addToken = N(fo.addToken, fl)
            }
            fo.map = [];
            a4(fn, fo, cC(fm, fn));
            if (fo.map.length == 0) {
                fo.map.push(0, 0, fo.content.appendChild(a2(fm.display.measure)))
            }
            if (fp == 0) {
                fq.measure.map = fo.map;
                fq.measure.cache = {}
            } else {
                (fq.measure.maps || (fq.measure.maps = [])).push(fo.map);
                (fq.measure.caches || (fq.measure.caches = [])).push({})
            }
        }
        ao(fm, "renderLine", fm, fq.line, fo.pre);
        return fo
    }

    function eq(fm) {
        var fl = e5("span", "\u2022", "cm-invalidchar");
        fl.title = "\\u" + fm.charCodeAt(0).toString(16);
        return fl
    }

    function p(fq, fA, fl, fo, fB, fz) {
        if (!fA) {
            return
        }
        var fv = fq.cm.options.specialChars,
            fu = false;
        if (!fv.test(fA)) {
            fq.col += fA.length;
            var ft = document.createTextNode(fA);
            fq.map.push(fq.pos, fq.pos + fA.length, ft);
            if (bK) {
                fu = true
            }
            fq.pos += fA.length
        } else {
            var ft = document.createDocumentFragment(),
                fx = 0;
            while (true) {
                fv.lastIndex = fx;
                var fm = fv.exec(fA);
                var fs = fm ? fm.index - fx : fA.length - fx;
                if (fs) {
                    var fp = document.createTextNode(fA.slice(fx, fx + fs));
                    if (bK) {
                        ft.appendChild(e5("span", [fp]))
                    } else {
                        ft.appendChild(fp)
                    }
                    fq.map.push(fq.pos, fq.pos + fs, fp);
                    fq.col += fs;
                    fq.pos += fs
                }
                if (!fm) {
                    break
                }
                fx += fs + 1;
                if (fm[0] == "\t") {
                    var fr = fq.cm.options.tabSize,
                        fw = fr - fq.col % fr;
                    var fp = ft.appendChild(e5("span", b1(fw), "cm-tab"));
                    fq.col += fw
                } else {
                    var fp = fq.cm.options.specialCharPlaceholder(fm[0]);
                    if (bK) {
                        ft.appendChild(e5("span", [fp]))
                    } else {
                        ft.appendChild(fp)
                    }
                    fq.col += 1
                }
                fq.map.push(fq.pos, fq.pos + 1, fp);
                fq.pos++
            }
        }
        if (fl || fo || fB || fu) {
            var fy = fl || "";
            if (fo) {
                fy += fo
            }
            if (fB) {
                fy += fB
            }
            var fn = e5("span", [ft], fy);
            if (fz) {
                fn.title = fz
            }
            return fq.content.appendChild(fn)
        }
        fq.content.appendChild(ft)
    }

    function eP(fl) {
        function fm(fn) {
            var fo = " ";
            for (var fp = 0; fp < fn.length - 2;
                ++fp) {
                fo += fp % 2 ? " " : "\u00a0"
            }
            fo += " ";
            return fo
        }
        return function(fo, fs, fp, fn, fr, fq) {
            fl(fo, fs.replace(/ {3,}/g, fm), fp, fn, fr, fq)
        }
    }

    function N(fm, fl) {
        return function(ft, fv, fn, fr, fw, fu) {
            fn = fn ? fn + " cm-force-border" : "cm-force-border";
            var fo = ft.pos,
                fq = fo + fv.length;
            for (;;) {
                for (var fs = 0; fs < fl.length; fs++) {
                    var fp = fl[fs];
                    if (fp.to > fo && fp.from <= fo) {
                        break
                    }
                }
                if (fp.to >= fq) {
                    return fm(ft, fv, fn, fr, fw, fu)
                }
                fm(ft, fv.slice(0, fp.to - fo), fn, fr, null, fu);
                fr = null;
                fv = fv.slice(fp.to - fo);
                fo = fp.to
            }
        }
    }

    function R(fm, fo, fl, fn) {
        var fp = !fn && fl.widgetNode;
        if (fp) {
            fm.map.push(fm.pos, fm.pos + fo, fp);
            fm.content.appendChild(fp)
        }
        fm.pos += fo
    }

    function a4(fu, fA, ft) {
        var fq = fu.markedSpans,
            fs = fu.text,
            fy = 0;
        if (!fq) {
            for (var fD = 1; fD < ft.length; fD += 2) {
                fA.addToken(fA, fs.slice(fy, fy = ft[fD]), ed(ft[fD + 1], fA))
            }
            return
        }
        var fE = fs.length,
            fp = 0,
            fD = 1,
            fw = "",
            fF;
        var fH = 0,
            fl, fG, fx, fI, fn;
        for (;;) {
            if (fH == fp) {
                fl = fG = fx = fI = "";
                fn = null;
                fH = Infinity;
                var fr = [];
                for (var fB = 0; fB < fq.length;
                    ++fB) {
                    var fC = fq[fB],
                        fz = fC.marker;
                    if (fC.from <= fp && (fC.to == null || fC.to > fp)) {
                        if (fC.to != null && fH > fC.to) {
                            fH = fC.to;
                            fG = ""
                        }
                        if (fz.className) {
                            fl += " " + fz.className
                        }
                        if (fz.startStyle && fC.from == fp) {
                            fx += " " + fz.startStyle
                        }
                        if (fz.endStyle && fC.to == fH) {
                            fG += " " + fz.endStyle
                        }
                        if (fz.title && !fI) {
                            fI = fz.title
                        }
                        if (fz.collapsed && (!fn || db(fn.marker, fz) < 0)) {
                            fn = fC
                        }
                    } else {
                        if (fC.from > fp && fH > fC.from) {
                            fH = fC.from
                        }
                    }
                    if (fz.type == "bookmark" && fC.from == fp && fz.widgetNode) {
                        fr.push(fz)
                    }
                }
                if (fn && (fn.from || 0) == fp) {
                    R(fA, (fn.to == null ? fE + 1 : fn.to) - fp, fn.marker, fn.from == null);
                    if (fn.to == null) {
                        return
                    }
                }
                if (!fn && fr.length) {
                    for (var fB = 0; fB < fr.length;
                        ++fB) {
                        R(fA, 0, fr[fB])
                    }
                }
            }
            if (fp >= fE) {
                break
            }
            var fv = Math.min(fE, fH);
            while (true) {
                if (fw) {
                    var fm = fp + fw.length;
                    if (!fn) {
                        var fo = fm > fv ? fw.slice(0, fv - fp) : fw;
                        fA.addToken(fA, fo, fF ? fF + fl : fl, fx, fp + fo.length == fH ? fG : "", fI)
                    }
                    if (fm >= fv) {
                        fw = fw.slice(fv - fp);
                        fp = fv;
                        break
                    }
                    fp = fm;
                    fx = ""
                }
                fw = fs.slice(fy, fy = ft[fD++]);
                fF = ed(ft[fD++], fA)
            }
        }
    }

    function dd(fl, fm) {
        return fm.from.ch == 0 && fm.to.ch == 0 && eR(fm.text) == "" && (!fl.cm || fl.cm.options.wholeLineUpdateBefore)
    }

    function eL(fy, ft, fl, fp) {
        function fz(fB) {
            return fl ? fl[fB] : null
        }

        function fm(fB, fD, fC) {
            dG(fB, fD, fC, fp);
            T(fB, "change", fB, ft)
        }
        var fw = ft.from,
            fx = ft.to,
            fA = ft.text;
        var fu = es(fy, fw.line),
            fv = es(fy, fx.line);
        var fs = eR(fA),
            fo = fz(fA.length - 1),
            fr = fx.line - fw.line;
        if (dd(fy, ft)) {
            for (var fn = 0, fq = []; fn < fA.length - 1;
                ++fn) {
                fq.push(new fb(fA[fn], fz(fn), fp))
            }
            fm(fv, fv.text, fo);
            if (fr) {
                fy.remove(fw.line, fr)
            }
            if (fq.length) {
                fy.insert(fw.line, fq)
            }
        } else {
            if (fu == fv) {
                if (fA.length == 1) {
                    fm(fu, fu.text.slice(0, fw.ch) + fs + fu.text.slice(fx.ch), fo)
                } else {
                    for (var fq = [], fn = 1; fn < fA.length - 1;
                        ++fn) {
                        fq.push(new fb(fA[fn], fz(fn), fp))
                    }
                    fq.push(new fb(fs + fu.text.slice(fx.ch), fo, fp));
                    fm(fu, fu.text.slice(0, fw.ch) + fA[0], fz(0));
                    fy.insert(fw.line + 1, fq)
                }
            } else {
                if (fA.length == 1) {
                    fm(fu, fu.text.slice(0, fw.ch) + fA[0] + fv.text.slice(fx.ch), fz(0));
                    fy.remove(fw.line + 1, fr)
                } else {
                    fm(fu, fu.text.slice(0, fw.ch) + fA[0], fz(0));
                    fm(fv, fs + fv.text.slice(fx.ch), fo);
                    for (var fn = 1, fq = []; fn < fA.length - 1;
                        ++fn) {
                        fq.push(new fb(fA[fn], fz(fn), fp))
                    }
                    if (fr > 1) {
                        fy.remove(fw.line + 1, fr - 1)
                    }
                    fy.insert(fw.line + 1, fq)
                }
            }
        }
        T(fy, "change", fy, ft)
    }

    function eg(fm) {
        this.lines = fm;
        this.parent = null;
        for (var fn = 0, fl = 0; fn < fm.length;
            ++fn) {
            fm[fn].parent = this;
            fl += fm[fn].height
        }
        this.height = fl
    }
    eg.prototype = {
        chunkSize: function() {
            return this.lines.length
        },
        removeInner: function(fl, fp) {
            for (var fn = fl, fo = fl + fp; fn < fo;
                ++fn) {
                var fm = this.lines[fn];
                this.height -= fm.height;
                be(fm);
                T(fm, "delete")
            }
            this.lines.splice(fl, fp)
        },
        collapse: function(fl) {
            fl.push.apply(fl, this.lines)
        },
        insertInner: function(fm, fn, fl) {
            this.height += fl;
            this.lines = this.lines.slice(0, fm).concat(fn).concat(this.lines.slice(fm));
            for (var fo = 0; fo < fn.length;
                ++fo) {
                fn[fo].parent = this
            }
        },
        iterN: function(fl, fo, fn) {
            for (var fm = fl + fo; fl < fm;
                ++fl) {
                if (fn(this.lines[fl])) {
                    return true
                }
            }
        }
    };

    function eK(fo) {
        this.children = fo;
        var fn = 0,
            fl = 0;
        for (var fm = 0; fm < fo.length;
            ++fm) {
            var fp = fo[fm];
            fn += fp.chunkSize();
            fl += fp.height;
            fp.parent = this
        }
        this.size = fn;
        this.height = fl;
        this.parent = null
    }
    eK.prototype = {
        chunkSize: function() {
            return this.size
        },
        removeInner: function(fl, fs) {
            this.size -= fs;
            for (var fn = 0; fn < this.children.length;
                ++fn) {
                var fr = this.children[fn],
                    fp = fr.chunkSize();
                if (fl < fp) {
                    var fo = Math.min(fs, fp - fl),
                        fq = fr.height;
                    fr.removeInner(fl, fo);
                    this.height -= fq - fr.height;
                    if (fp == fo) {
                        this.children.splice(fn--, 1);
                        fr.parent = null
                    }
                    if ((fs -= fo) == 0) {
                        break
                    }
                    fl = 0
                } else {
                    fl -= fp
                }
            }
            if (this.size - fs < 25 && (this.children.length > 1 || !(this.children[0] instanceof eg))) {
                var fm = [];
                this.collapse(fm);
                this.children = [new eg(fm)];
                this.children[0].parent = this
            }
        },
        collapse: function(fl) {
            for (var fm = 0; fm < this.children.length;
                ++fm) {
                this.children[fm].collapse(fl)
            }
        },
        insertInner: function(fm, fn, fl) {
            this.size += fn.length;
            this.height += fl;
            for (var fq = 0; fq < this.children.length;
                ++fq) {
                var fs = this.children[fq],
                    fr = fs.chunkSize();
                if (fm <= fr) {
                    fs.insertInner(fm, fn, fl);
                    if (fs.lines && fs.lines.length > 50) {
                        while (fs.lines.length > 50) {
                            var fp = fs.lines.splice(fs.lines.length - 25, 25);
                            var fo = new eg(fp);
                            fs.height -= fo.height;
                            this.children.splice(fq + 1, 0, fo);
                            fo.parent = this
                        }
                        this.maybeSpill()
                    }
                    break
                }
                fm -= fr
            }
        },
        maybeSpill: function() {
            if (this.children.length <= 10) {
                return
            }
            var fo = this;
            do {
                var fm = fo.children.splice(fo.children.length - 5, 5);
                var fn = new eK(fm);
                if (!fo.parent) {
                    var fp = new eK(fo.children);
                    fp.parent = fo;
                    fo.children = [fp, fn];
                    fo = fp
                } else {
                    fo.size -= fn.size;
                    fo.height -= fn.height;
                    var fl = cM(fo.parent.children, fo);
                    fo.parent.children.splice(fl + 1, 0, fn)
                }
                fn.parent = fo.parent
            } while (fo.children.length > 10);
            fo.parent.maybeSpill()
        },
        iterN: function(fl, fr, fq) {
            for (var fm = 0; fm < this.children.length;
                ++fm) {
                var fp = this.children[fm],
                    fo = fp.chunkSize();
                if (fl < fo) {
                    var fn = Math.min(fr, fo - fl);
                    if (fp.iterN(fl, fn, fq)) {
                        return true
                    }
                    if ((fr -= fn) == 0) {
                        break
                    }
                    fl = 0
                } else {
                    fl -= fo
                }
            }
        }
    };
    var b2 = 0;
    var ah = C.Doc = function(fn, fm, fl) {
        if (!(this instanceof ah)) {
            return new ah(fn, fm, fl)
        }
        if (fl == null) {
            fl = 0
        }
        eK.call(this, [new eg([new fb("", null)])]);
        this.first = fl;
        this.scrollTop = this.scrollLeft = 0;
        this.cantEdit = false;
        this.cleanGeneration = 1;
        this.frontier = fl;
        var fo = O(fl, 0);
        this.sel = d8(fo);
        this.history = new e1(null, this);
        this.id = ++b2;
        this.modeOption = fm;
        if (typeof fn == "string") {
            fn = aG(fn)
        }
        eL(this, {
            from: fo,
            to: fo,
            text: fn
        });
        bw(this, d8(fo), false)
    };
    ah.prototype = bW(eK.prototype, {
        constructor: ah,
        iter: function(fn, fm, fl) {
            if (fl) {
                this.iterN(fn - this.first, fm - fn, fl)
            } else {
                this.iterN(this.first, this.first + this.size, fn)
            }
        },
        insert: function(fm, fn) {
            var fl = 0;
            for (var fo = 0; fo < fn.length;
                ++fo) {
                fl += fn[fo].height
            }
            this.insertInner(fm - this.first, fn, fl)
        },
        remove: function(fl, fm) {
            this.removeInner(fl - this.first, fm)
        },
        getValue: function(fm) {
            var fl = aI(this, this.first, this.first + this.size);
            if (fm === false) {
                return fl
            }
            return fl.join(fm || "\n")
        },
        setValue: cd(function(fm) {
            var fn = O(this.first, 0),
                fl = this.first + this.size - 1;
            aV(this, {
                from: fn,
                to: O(fl, es(this, fl).text.length),
                text: aG(fm),
                origin: "setValue"
            }, true);
            bw(this, d8(fn))
        }),
        replaceRange: function(fm, fo, fn, fl) {
            fo = eT(this, fo);
            fn = fn ? eT(this, fn) : fo;
            aH(this, fm, fo, fn, fl)
        },
        getRange: function(fo, fn, fm) {
            var fl = e7(this, eT(this, fo), eT(this, fn));
            if (fm === false) {
                return fl
            }
            return fl.join(fm || "\n")
        },
        getLine: function(fm) {
            var fl = this.getLineHandle(fm);
            return fl && fl.text
        },
        getLineHandle: function(fl) {
            if (bJ(this, fl)) {
                return es(this, fl)
            }
        },
        getLineNumber: function(fl) {
            return bp(fl)
        },
        getLineHandleVisualStart: function(fl) {
            if (typeof fl == "number") {
                fl = es(this, fl)
            }
            return u(fl)
        },
        lineCount: function() {
            return this.size
        },
        firstLine: function() {
            return this.first
        },
        lastLine: function() {
            return this.first + this.size - 1
        },
        clipPos: function(fl) {
            return eT(this, fl)
        },
        getCursor: function(fn) {
            var fl = this.sel.primary(),
                fm;
            if (fn == null || fn == "head") {
                fm = fl.head
            } else {
                if (fn == "anchor") {
                    fm = fl.anchor
                } else {
                    if (fn == "end" || fn == "to" || fn === false) {
                        fm = fl.to()
                    } else {
                        fm = fl.from()
                    }
                }
            }
            return fm
        },
        listSelections: function() {
            return this.sel.ranges
        },
        somethingSelected: function() {
            return this.sel.somethingSelected()
        },
        setCursor: cd(function(fm, fn, fl) {
            A(this, eT(this, typeof fm == "number" ? O(fm, fn || 0) : fm), null, fl)
        }),
        setSelection: cd(function(fm, fn, fl) {
            A(this, eT(this, fm), eT(this, fn || fm), fl)
        }),
        extendSelection: cd(function(fn, fm, fl) {
            e2(this, eT(this, fn), fm && eT(this, fm), fl)
        }),
        extendSelections: cd(function(fm, fl) {
            aj(this, dj(this, fm, fl))
        }),
        extendSelectionsBy: cd(function(fm, fl) {
            aj(this, bu(this.sel.ranges, fm), fl)
        }),
        setSelections: cd(function(fm, fp, fl) {
            if (!fm.length) {
                return
            }
            for (var fo = 0, fn = []; fo < fm.length; fo++) {
                fn[fo] = new di(eT(this, fm[fo].anchor), eT(this, fm[fo].head))
            }
            if (fp == null) {
                fp = fm.length - 1
            }
            bw(this, b8(fn, fp), fl)
        }),
        addSelection: cd(function(fm, fn) {
            var fl = this.sel.ranges.slice(0);
            fl.push(new di(eT(this, fm), eT(this, fn || fm)));
            bw(this, b8(fl, fl.length - 1), false)
        }),
        getSelection: function(fp) {
            var fm = this.sel.ranges,
                fl;
            for (var fn = 0; fn < fm.length; fn++) {
                var fo = e7(this, fm[fn].from(), fm[fn].to());
                fl = fl ? fl.concat(fo) : fo
            }
            if (fp === false) {
                return fl
            } else {
                return fl.join(fp || "\n")
            }
        },
        getSelections: function(fp) {
            var fo = [],
                fl = this.sel.ranges;
            for (var fm = 0; fm < fl.length; fm++) {
                var fn = e7(this, fl[fm].from(), fl[fm].to());
                if (fp !== false) {
                    fn = fn.join(fp || "\n")
                }
                fo[fm] = fn
            }
            return fo
        },
        replaceSelection: cd(function(fn, fp, fl) {
            var fo = [];
            for (var fm = 0; fm < this.sel.ranges.length; fm++) {
                fo[fm] = fn
            }
            this.replaceSelections(fo, fp, fl)
        }),
        replaceSelections: function(fq, fs, fn) {
            var fp = [],
                fr = this.sel;
            for (var fo = 0; fo < fr.ranges.length; fo++) {
                var fm = fr.ranges[fo];
                fp[fo] = {
                    from: fm.from(),
                    to: fm.to(),
                    text: aG(fq[fo]),
                    origin: fn
                }
            }
            var fl = fs && fs != "end" && U(this, fp, fs);
            for (var fo = fp.length - 1; fo >= 0; fo--) {
                aV(this, fp[fo])
            }
            if (fl) {
                ek(this, fl)
            } else {
                if (this.cm) {
                    eQ(this.cm)
                }
            }
        },
        undo: cd(function() {
            bI(this, "undo")
        }),
        redo: cd(function() {
            bI(this, "redo")
        }),
        undoSelection: cd(function() {
            bI(this, "undo", true)
        }),
        redoSelection: cd(function() {
            bI(this, "redo", true)
        }),
        setExtending: function(fl) {
            this.extend = fl
        },
        historySize: function() {
            var fo = this.history,
                fl = 0,
                fn = 0;
            for (var fm = 0; fm < fo.done.length; fm++) {
                if (!fo.done[fm].ranges) {
                    ++fl
                }
            }
            for (var fm = 0; fm < fo.undone.length; fm++) {
                if (!fo.undone[fm].ranges) {
                    ++fn
                }
            }
            return {
                undo: fl,
                redo: fn
            }
        },
        clearHistory: function() {
            this.history = new e1(this.history.maxGeneration, this)
        },
        markClean: function() {
            this.cleanGeneration = this.changeGeneration(true)
        },
        changeGeneration: function(fl) {
            if (fl) {
                this.history.lastOp = this.history.lastOrigin = null
            }
            return this.history.generation
        },
        isClean: function(fl) {
            return this.history.generation == (fl || this.cleanGeneration)
        },
        getHistory: function() {
            return {
                done: br(this.history.done),
                undone: br(this.history.undone)
            }
        },
        setHistory: function(fm) {
            var fl = this.history = new e1(this.history.maxGeneration, this);
            fl.done = br(fm.done.slice(0), null, true);
            fl.undone = br(fm.undone.slice(0), null, true)
        },
        markText: function(fn, fm, fl) {
            return dY(this, eT(this, fn), eT(this, fm), fl, "range")
        },
        setBookmark: function(fn, fl) {
            var fm = {
                replacedWith: fl && (fl.nodeType == null ? fl.widget : fl),
                insertLeft: fl && fl.insertLeft,
                clearWhenEmpty: false
            };
            fn = eT(this, fn);
            return dY(this, fn, fn, fm, "bookmark")
        },
        findMarksAt: function(fp) {
            fp = eT(this, fp);
            var fo = [],
                fm = es(this, fp.line).markedSpans;
            if (fm) {
                for (var fl = 0; fl < fm.length;
                    ++fl) {
                    var fn = fm[fl];
                    if ((fn.from == null || fn.from <= fp.ch) && (fn.to == null || fn.to >= fp.ch)) {
                        fo.push(fn.marker.parent || fn.marker)
                    }
                }
            }
            return fo
        },
        findMarks: function(fo, fn) {
            fo = eT(this, fo);
            fn = eT(this, fn);
            var fl = [],
                fm = fo.line;
            this.iter(fo.line, fn.line + 1, function(fp) {
                var fr = fp.markedSpans;
                if (fr) {
                    for (var fq = 0; fq < fr.length; fq++) {
                        var fs = fr[fq];
                        if (!(fm == fo.line && fo.ch > fs.to || fs.from == null && fm != fo.line || fm == fn.line && fs.from > fn.ch)) {
                            fl.push(fs.marker.parent || fs.marker)
                        }
                    }
                }++fm
            });
            return fl
        },
        getAllMarks: function() {
            var fl = [];
            this.iter(function(fn) {
                var fm = fn.markedSpans;
                if (fm) {
                    for (var fo = 0; fo < fm.length;
                        ++fo) {
                        if (fm[fo].from != null) {
                            fl.push(fm[fo].marker)
                        }
                    }
                }
            });
            return fl
        },
        posFromIndex: function(fm) {
            var fl, fn = this.first;
            this.iter(function(fo) {
                var fp = fo.text.length + 1;
                if (fp > fm) {
                    fl = fm;
                    return true
                }
                fm -= fp;
                ++fn
            });
            return eT(this, O(fn, fl))
        },
        indexFromPos: function(fm) {
            fm = eT(this, fm);
            var fl = fm.ch;
            if (fm.line < this.first || fm.ch < 0) {
                return 0
            }
            this.iter(this.first, fm.line, function(fn) {
                fl += fn.text.length + 1
            });
            return fl
        },
        copy: function(fl) {
            var fm = new ah(aI(this, this.first, this.first + this.size), this.modeOption, this.first);
            fm.scrollTop = this.scrollTop;
            fm.scrollLeft = this.scrollLeft;
            fm.sel = this.sel;
            fm.extend = false;
            if (fl) {
                fm.history.undoDepth = this.history.undoDepth;
                fm.setHistory(this.getHistory())
            }
            return fm
        },
        linkedDoc: function(fl) {
            if (!fl) {
                fl = {}
            }
            var fo = this.first,
                fn = this.first + this.size;
            if (fl.from != null && fl.from > fo) {
                fo = fl.from
            }
            if (fl.to != null && fl.to < fn) {
                fn = fl.to
            }
            var fm = new ah(aI(this, fo, fn), fl.mode || this.modeOption, fo);
            if (fl.sharedHist) {
                fm.history = this.history
            }(this.linked || (this.linked = [])).push({
                doc: fm,
                sharedHist: fl.sharedHist
            });
            fm.linked = [{
                doc: this,
                isParent: true,
                sharedHist: fl.sharedHist
            }];
            return fm
        },
        unlinkDoc: function(fm) {
            if (fm instanceof C) {
                fm = fm.doc
            }
            if (this.linked) {
                for (var fn = 0; fn < this.linked.length;
                    ++fn) {
                    var fo = this.linked[fn];
                    if (fo.doc != fm) {
                        continue
                    }
                    this.linked.splice(fn, 1);
                    fm.unlinkDoc(this);
                    break
                }
            }
            if (fm.history == this.history) {
                var fl = [fm.id];
                dr(fm, function(fp) {
                    fl.push(fp.id)
                }, true);
                fm.history = new e1(null, fm);
                fm.history.done = br(this.history.done, fl);
                fm.history.undone = br(this.history.undone, fl)
            }
        },
        iterLinkedDocs: function(fl) {
            dr(this, fl)
        },
        getMode: function() {
            return this.mode
        },
        getEditor: function() {
            return this.cm
        }
    });
    ah.prototype.eachLine = ah.prototype.iter;
    var d = "iter insert remove copy getEditor".split(" ");
    for (var bm in ah.prototype) {
        if (ah.prototype.hasOwnProperty(bm) && cM(d, bm) < 0) {
            C.prototype[bm] = (function(fl) {
                return function() {
                    return fl.apply(this.doc, arguments)
                }
            })(ah.prototype[bm])
        }
    }
    bd(ah);

    function dr(fo, fn, fm) {
        function fl(fu, fs, fq) {
            if (fu.linked) {
                for (var fr = 0; fr < fu.linked.length;
                    ++fr) {
                    var fp = fu.linked[fr];
                    if (fp.doc == fs) {
                        continue
                    }
                    var ft = fq && fp.sharedHist;
                    if (fm && !ft) {
                        continue
                    }
                    fn(fp.doc, ft);
                    fl(fp.doc, fu, ft)
                }
            }
        }
        fl(fo, null, true)
    }

    function du(fl, fm) {
        if (fm.cm) {
            throw new Error("This document is already in use.")
        }
        fl.doc = fm;
        fm.cm = fl;
        P(fl);
        a6(fl);
        if (!fl.options.lineWrapping) {
            e8(fl)
        }
        fl.options.mode = fm.modeOption;
        W(fl)
    }

    function es(fo, fq) {
        fq -= fo.first;
        if (fq < 0 || fq >= fo.size) {
            throw new Error("There is no line " + (fq + fo.first) + " in the document.")
        }
        for (var fl = fo; !fl.lines;) {
            for (var fm = 0;;
                ++fm) {
                var fp = fl.children[fm],
                    fn = fp.chunkSize();
                if (fq < fn) {
                    fl = fp;
                    break
                }
                fq -= fn
            }
        }
        return fl.lines[fq]
    }

    function e7(fn, fp, fl) {
        var fm = [],
            fo = fp.line;
        fn.iter(fp.line, fl.line + 1, function(fq) {
            var fr = fq.text;
            if (fo == fl.line) {
                fr = fr.slice(0, fl.ch)
            }
            if (fo == fp.line) {
                fr = fr.slice(fp.ch)
            }
            fm.push(fr);
            ++fo
        });
        return fm
    }

    function aI(fm, fo, fn) {
        var fl = [];
        fm.iter(fo, fn, function(fp) {
            fl.push(fp.text)
        });
        return fl
    }

    function e9(fm, fl) {
        var fn = fl - fm.height;
        if (fn) {
            for (var fo = fm; fo; fo = fo.parent) {
                fo.height += fn
            }
        }
    }

    function bp(fl) {
        if (fl.parent == null) {
            return null
        }
        var fp = fl.parent,
            fo = cM(fp.lines, fl);
        for (var fm = fp.parent; fm; fp = fm, fm = fm.parent) {
            for (var fn = 0;;
                ++fn) {
                if (fm.children[fn] == fp) {
                    break
                }
                fo += fm.children[fn].chunkSize()
            }
        }
        return fo + fp.first
    }

    function bi(fn, fq) {
        var fs = fn.first;
        outer: do {
            for (var fo = 0; fo < fn.children.length;
                ++fo) {
                var fr = fn.children[fo],
                    fp = fr.height;
                if (fq < fp) {
                    fn = fr;
                    continue outer
                }
                fq -= fp;
                fs += fr.chunkSize()
            }
            return fs
        } while (!fn.lines);
        for (var fo = 0; fo < fn.lines.length;
            ++fo) {
            var fm = fn.lines[fo],
                fl = fm.height;
            if (fq < fl) {
                break
            }
            fq -= fl
        }
        return fs + fo
    }

    function bo(fn) {
        fn = u(fn);
        var fp = 0,
            fm = fn.parent;
        for (var fo = 0; fo < fm.lines.length;
            ++fo) {
            var fl = fm.lines[fo];
            if (fl == fn) {
                break
            } else {
                fp += fl.height
            }
        }
        for (var fq = fm.parent; fq; fm = fq, fq = fm.parent) {
            for (var fo = 0; fo < fq.children.length;
                ++fo) {
                var fr = fq.children[fo];
                if (fr == fm) {
                    break
                } else {
                    fp += fr.height
                }
            }
        }
        return fp
    }

    function a(fm) {
        var fl = fm.order;
        if (fl == null) {
            fl = fm.order = aW(fm.text)
        }
        return fl
    }

    function e1(fl, fm) {
        this.done = [];
        this.undone = [];
        this.undoDepth = Infinity;
        this.lastModTime = this.pendingSelTime = 0;
        this.lastOp = null;
        this.lastOrigin = null;
        this.pendingSelection = fm.sel;
        this.generation = this.maxGeneration = fl || 1;
        this.atomicSelection = false
    }

    function cU(fl, fn) {
        var fm = {
            from: bV(fn.from),
            to: cs(fn),
            text: e7(fl, fn.from, fn.to)
        };
        bA(fl, fm, fn.from.line, fn.to.line + 1);
        dr(fl, function(fo) {
            bA(fo, fm, fn.from.line, fn.to.line + 1)
        }, true);
        return fm
    }

    function d5(fm) {
        for (;;) {
            var fl = eR(fm.done);
            if (fl && fl.ranges) {
                fm.done.pop()
            } else {
                return fl
            }
        }
    }

    function eW(fr, fp, fl, fo) {
        var fn = fr.history;
        fn.undone.length = 0;
        cz(fr, fn.done);
        var fm = +new Date,
            fs;
        if ((fn.lastOp == fo || fn.lastOrigin == fp.origin && fp.origin && ((fp.origin.charAt(0) == "+" && fr.cm && fn.lastModTime > fm - fr.cm.options.historyEventDelay) || fp.origin.charAt(0) == "*")) && (fs = d5(fn))) {
            var ft = eR(fs.changes);
            if (bR(fp.from, fp.to) == 0 && bR(fp.from, ft.to) == 0) {
                ft.to = cs(fp)
            } else {
                fs.changes.push(cU(fr, fp))
            }
        } else {
            var fq = eR(fn.done);
            if (!fq || !fq.ranges) {
                cn(fr.sel, fn.done)
            }
            fs = {
                changes: [cU(fr, fp)],
                generation: fn.generation
            };
            fn.done.push(fs);
            while (fn.done.length > fn.undoDepth) {
                fn.done.shift();
                if (!fn.done[0].ranges) {
                    fn.done.shift()
                }
            }
        }
        fn.done.push(fl);
        fn.generation = ++fn.maxGeneration;
        fn.lastModTime = fm;
        fn.lastOp = fo;
        fn.lastOrigin = fp.origin;
        if (!ft) {
            ao(fr, "historyAdded")
        }
    }

    function fe(fq, fo, fl) {
        var fp = fq.history,
            fn = fp.pendingSelection,
            fm = +new Date;
        if (fn && !fp.atomicSelection && fl != fp.lastOp && (fn.ranges.length != fo.ranges.length || fo.somethingSelected() != fn.somethingSelected() || fm - fp.pendingSelTime > (fq.cm ? fq.cm.options.historySelectionEventDelay : 1000))) {
            cz(fq, fp.done)
        }
        fp.pendingSelection = fo;
        fp.pendingSelTime = fm;
        fp.lastOp = fl
    }

    function cn(fm, fl) {
        var fn = eR(fl);
        if (!(fn && fn.ranges && fn.equals(fm))) {
            fl.push(fm)
        }
    }

    function cz(fn, fl) {
        var fm = fn.history;
        if (fm.pendingSelection) {
            cn(fm.pendingSelection, fl);
            fm.pendingSelection = null
        }
    }

    function bA(fm, fq, fp, fo) {
        var fl = fq["spans_" + fm.id],
            fn = 0;
        fm.iter(Math.max(fm.first, fp), Math.min(fm.first + fm.size, fo), function(fr) {
            if (fr.markedSpans) {
                (fl || (fl = fq["spans_" + fm.id] = {}))[fn] = fr.markedSpans
            }++fn
        })
    }

    function a0(fn) {
        if (!fn) {
            return null
        }
        for (var fm = 0, fl; fm < fn.length;
            ++fm) {
            if (fn[fm].marker.explicitlyCleared) {
                if (!fl) {
                    fl = fn.slice(0, fm)
                }
            } else {
                if (fl) {
                    fl.push(fn[fm])
                }
            }
        }
        return !fl ? fn : fl.length ? fl : null
    }

    function bF(fo, fp) {
        var fn = fp["spans_" + fo.id];
        if (!fn) {
            return null
        }
        for (var fm = 0, fl = []; fm < fp.text.length;
            ++fm) {
            fl.push(a0(fn[fm]))
        }
        return fl
    }

    function br(fw, fo, fv) {
        for (var fr = 0, fm = []; fr < fw.length;
            ++fr) {
            var fn = fw[fr];
            if (fn.ranges) {
                fm.push(fv ? e6.prototype.deepCopy.call(fn) : fn);
                continue
            }
            var ft = fn.changes,
                fu = [];
            fm.push({
                changes: fu
            });
            for (var fq = 0; fq < ft.length;
                ++fq) {
                var fs = ft[fq],
                    fp;
                fu.push({
                    from: fs.from,
                    to: fs.to,
                    text: fs.text
                });
                if (fo) {
                    for (var fl in fs) {
                        if (fp = fl.match(/^spans_(\d+)$/)) {
                            if (cM(fo, Number(fp[1])) > -1) {
                                eR(fu)[fl] = fs[fl];
                                delete fs[fl]
                            }
                        }
                    }
                }
            }
        }
        return fm
    }

    function D(fo, fn, fm, fl) {
        if (fm < fo.line) {
            fo.line += fl
        } else {
            if (fn < fo.line) {
                fo.line = fn;
                fo.ch = 0
            }
        }
    }

    function eu(fo, fq, fr, fs) {
        for (var fn = 0; fn < fo.length;
            ++fn) {
            var fl = fo[fn],
                fp = true;
            if (fl.ranges) {
                if (!fl.copied) {
                    fl = fo[fn] = fl.deepCopy();
                    fl.copied = true
                }
                for (var fm = 0; fm < fl.ranges.length; fm++) {
                    D(fl.ranges[fm].anchor, fq, fr, fs);
                    D(fl.ranges[fm].head, fq, fr, fs)
                }
                continue
            }
            for (var fm = 0; fm < fl.changes.length;
                ++fm) {
                var ft = fl.changes[fm];
                if (fr < ft.from.line) {
                    ft.from = O(ft.from.line + fs, ft.from.ch);
                    ft.to = O(ft.to.line + fs, ft.to.ch)
                } else {
                    if (fq <= ft.to.line) {
                        fp = false;
                        break
                    }
                }
            }
            if (!fp) {
                fo.splice(0, fn + 1);
                fn = 0
            }
        }
    }

    function c2(fm, fp) {
        var fo = fp.from.line,
            fn = fp.to.line,
            fl = fp.text.length - (fn - fo) - 1;
        eu(fm.done, fo, fn, fl);
        eu(fm.undone, fo, fn, fl)
    }
    var cg = C.e_preventDefault = function(fl) {
        if (fl.preventDefault) {
            fl.preventDefault()
        } else {
            fl.returnValue = false
        }
    };
    var cQ = C.e_stopPropagation = function(fl) {
        if (fl.stopPropagation) {
            fl.stopPropagation()
        } else {
            fl.cancelBubble = true
        }
    };

    function bn(fl) {
        return fl.defaultPrevented != null ? fl.defaultPrevented : fl.returnValue == false
    }
    var dJ = C.e_stop = function(fl) {
        cg(fl);
        cQ(fl)
    };

    function G(fl) {
        return fl.target || fl.srcElement
    }

    function eX(fm) {
        var fl = fm.which;
        if (fl == null) {
            if (fm.button & 1) {
                fl = 1
            } else {
                if (fm.button & 2) {
                    fl = 3
                } else {
                    if (fm.button & 4) {
                        fl = 2
                    }
                }
            }
        }
        if (bH && fm.ctrlKey && fl == 1) {
            fl = 3
        }
        return fl
    }
    var bz = C.on = function(fo, fm, fn) {
        if (fo.addEventListener) {
            fo.addEventListener(fm, fn, false)
        } else {
            if (fo.attachEvent) {
                fo.attachEvent("on" + fm, fn)
            } else {
                var fp = fo._handlers || (fo._handlers = {});
                var fl = fp[fm] || (fp[fm] = []);
                fl.push(fn)
            }
        }
    };
    var dw = C.off = function(fp, fn, fo) {
        if (fp.removeEventListener) {
            fp.removeEventListener(fn, fo, false)
        } else {
            if (fp.detachEvent) {
                fp.detachEvent("on" + fn, fo)
            } else {
                var fl = fp._handlers && fp._handlers[fn];
                if (!fl) {
                    return
                }
                for (var fm = 0; fm < fl.length;
                    ++fm) {
                    if (fl[fm] == fo) {
                        fl.splice(fm, 1);
                        break
                    }
                }
            }
        }
    };
    var ao = C.signal = function(fp, fo) {
        var fl = fp._handlers && fp._handlers[fo];
        if (!fl) {
            return
        }
        var fm = Array.prototype.slice.call(arguments, 2);
        for (var fn = 0; fn < fl.length;
            ++fn) {
            fl[fn].apply(null, fm)
        }
    };
    var a3, b3 = 0;

    function T(fq, fp) {
        var fl = fq._handlers && fq._handlers[fp];
        if (!fl) {
            return
        }
        var fn = Array.prototype.slice.call(arguments, 2);
        if (!a3) {
            ++b3;
            a3 = [];
            setTimeout(dS, 0)
        }

        function fm(fr) {
            return function() {
                fr.apply(null, fn)
            }
        }
        for (var fo = 0; fo < fl.length;
            ++fo) {
            a3.push(fm(fl[fo]))
        }
    }

    function dS() {
        --b3;
        var fl = a3;
        a3 = null;
        for (var fm = 0; fm < fl.length;
            ++fm) {
            fl[fm]()
        }
    }

    function ay(fl, fn, fm) {
        ao(fl, fm || fn.type, fl, fn);
        return bn(fn) || fn.codemirrorIgnore
    }

    function ev(fn, fm) {
        var fl = fn._handlers && fn._handlers[fm];
        return fl && fl.length > 0
    }

    function bd(fl) {
        fl.prototype.on = function(fm, fn) {
            bz(this, fm, fn)
        };
        fl.prototype.off = function(fm, fn) {
            dw(this, fm, fn)
        }
    }
    var aZ = 30;
    var bL = C.Pass = {
        toString: function() {
            return "CodeMirror.Pass"
        }
    };

    function fk() {
        this.id = null
    }
    fk.prototype.set = function(fl, fm) {
        clearTimeout(this.id);
        this.id = setTimeout(fm, fl)
    };
    var bv = C.countColumn = function(fo, fm, fq, fr, fn) {
        if (fm == null) {
            fm = fo.search(/[^\s\u00a0]/);
            if (fm == -1) {
                fm = fo.length
            }
        }
        for (var fp = fr || 0, fs = fn || 0;;) {
            var fl = fo.indexOf("\t", fp);
            if (fl < 0 || fl >= fm) {
                return fs + (fm - fp)
            }
            fs += fl - fp;
            fs += fq - (fs % fq);
            fp = fl + 1
        }
    };

    function dI(fp, fo, fq) {
        for (var fr = 0, fn = 0;;) {
            var fm = fp.indexOf("\t", fr);
            if (fm == -1) {
                fm = fp.length
            }
            var fl = fm - fr;
            if (fm == fp.length || fn + fl >= fo) {
                return fr + Math.min(fl, fo - fn)
            }
            fn += fm - fr;
            fn += fq - (fn % fq);
            fr = fm + 1;
            if (fn >= fo) {
                return fr
            }
        }
    }
    var aF = [""];

    function b1(fl) {
        while (aF.length <= fl) {
            aF.push(eR(aF) + " ")
        }
        return aF[fl]
    }

    function eR(fl) {
        return fl[fl.length - 1]
    }
    var c7 = function(fl) {
        fl.select()
    };
    if (eh) {
        c7 = function(fl) {
            fl.selectionStart = 0;
            fl.selectionEnd = fl.value.length
        }
    } else {
        if (c5) {
            c7 = function(fm) {
                try {
                    fm.select()
                } catch (fl) {}
            }
        }
    }

    function cM(fn, fl) {
        for (var fm = 0; fm < fn.length;
            ++fm) {
            if (fn[fm] == fl) {
                return fm
            }
        }
        return -1
    }
    if ([].indexOf) {
        cM = function(fm, fl) {
            return fm.indexOf(fl)
        }
    }

    function bu(fo, fn) {
        var fl = [];
        for (var fm = 0; fm < fo.length; fm++) {
            fl[fm] = fn(fo[fm], fm)
        }
        return fl
    }
    if ([].map) {
        bu = function(fm, fl) {
            return fm.map(fl)
        }
    }

    function bW(fo, fl) {
        var fn;
        if (Object.create) {
            fn = Object.create(fo)
        } else {
            var fm = function() {};
            fm.prototype = fo;
            fn = new fm()
        }
        if (fl) {
            au(fl, fn)
        }
        return fn
    }

    function au(fm, fl) {
        if (!fl) {
            fl = {}
        }
        for (var fn in fm) {
            if (fm.hasOwnProperty(fn)) {
                fl[fn] = fm[fn]
            }
        }
        return fl
    }

    function b7(fm) {
        var fl = Array.prototype.slice.call(arguments, 1);
        return function() {
            return fm.apply(null, fl)
        }
    }
    var aS = /[\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
    var cb = C.isWordChar = function(fl) {
        return /\w/.test(fl) || fl > "\x80" && (fl.toUpperCase() != fl.toLowerCase() || aS.test(fl))
    };

    function eb(fl) {
        for (var fm in fl) {
            if (fl.hasOwnProperty(fm) && fl[fm]) {
                return false
            }
        }
        return true
    }
    var d2 = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;

    function eD(fl) {
        return fl.charCodeAt(0) >= 768 && d2.test(fl)
    }

    function e5(fl, fp, fo, fn) {
        var fq = document.createElement(fl);
        if (fo) {
            fq.className = fo
        }
        if (fn) {
            fq.style.cssText = fn
        }
        if (typeof fp == "string") {
            fq.appendChild(document.createTextNode(fp))
        } else {
            if (fp) {
                for (var fm = 0; fm < fp.length;
                    ++fm) {
                    fq.appendChild(fp[fm])
                }
            }
        }
        return fq
    }
    var bX;
    if (document.createRange) {
        bX = function(fn, fo, fl) {
            var fm = document.createRange();
            fm.setEnd(fn, fl);
            fm.setStart(fn, fo);
            return fm
        }
    } else {
        bX = function(fn, fo, fl) {
            var fm = document.body.createTextRange();
            fm.moveToElementText(fn.parentNode);
            fm.collapse(true);
            fm.moveEnd("character", fl);
            fm.moveStart("character", fo);
            return fm
        }
    }

    function dk(fm) {
        for (var fl = fm.childNodes.length; fl > 0;
            --fl) {
            fm.removeChild(fm.firstChild)
        }
        return fm
    }

    function bt(fl, fm) {
        return dk(fl).appendChild(fm)
    }

    function c9() {
        return document.activeElement
    }
    if (d3) {
        c9 = function() {
            try {
                return document.activeElement
            } catch (fl) {
                return document.body
            }
        }
    }
    var d4 = function() {
        if (bK) {
            return false
        }
        var fl = e5("div");
        return "draggable" in fl || "dragDrop" in fl
    }();
    var dO;

    function i(fl) {
        if (dO != null) {
            return dO
        }
        var fm = e5("div", null, null, "width: 50px; height: 50px; overflow-x: scroll");
        bt(fl, fm);
        if (fm.offsetWidth) {
            dO = fm.offsetHeight - fm.clientHeight
        }
        return dO || 0
    }
    var eV;

    function a2(fl) {
        if (eV == null) {
            var fm = e5("span", "\u200b");
            bt(fl, e5("span", [fm, document.createTextNode("x")]));
            if (fl.firstChild.offsetHeight != 0) {
                eV = fm.offsetWidth <= 1 && fm.offsetHeight > 2 && !bN
            }
        }
        if (eV) {
            return e5("span", "\u200b")
        } else {
            return e5("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px")
        }
    }
    var eU;

    function bq(fo) {
        if (eU != null) {
            return eU
        }
        var fl = bt(fo, document.createTextNode("A\u062eA"));
        var fn = bX(fl, 0, 1).getBoundingClientRect();
        if (fn.left == fn.right) {
            return false
        }
        var fm = bX(fl, 1, 2).getBoundingClientRect();
        return eU = (fm.right - fn.right < 3)
    }
    var aG = C.splitLines = "\n\nb".split(/\n/).length != 3 ? function(fq) {
        var fr = 0,
            fl = [],
            fp = fq.length;
        while (fr <= fp) {
            var fo = fq.indexOf("\n", fr);
            if (fo == -1) {
                fo = fq.length
            }
            var fn = fq.slice(fr, fq.charAt(fo - 1) == "\r" ? fo - 1 : fo);
            var fm = fn.indexOf("\r");
            if (fm != -1) {
                fl.push(fn.slice(0, fm));
                fr += fm + 1
            } else {
                fl.push(fn);
                fr = fo + 1
            }
        }
        return fl
    } : function(fl) {
        return fl.split(/\r\n?|\n/)
    };
    var a7 = window.getSelection ? function(fm) {
        try {
            return fm.selectionStart != fm.selectionEnd
        } catch (fl) {
            return false
        }
    } : function(fn) {
        try {
            var fl = fn.ownerDocument.selection.createRange()
        } catch (fm) {}
        if (!fl || fl.parentElement() != fn) {
            return false
        }
        return fl.compareEndPoints("StartToEnd", fl) != 0
    };
    var cF = (function() {
        var fl = e5("div");
        if ("oncopy" in fl) {
            return true
        }
        fl.setAttribute("oncopy", "return;");
        return typeof fl.oncopy == "function"
    })();
    var et = {
        3: "Enter",
        8: "Backspace",
        9: "Tab",
        13: "Enter",
        16: "Shift",
        17: "Ctrl",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Esc",
        32: "Space",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "Left",
        38: "Up",
        39: "Right",
        40: "Down",
        44: "PrintScrn",
        45: "Insert",
        46: "Delete",
        59: ";",
        61: "=",
        91: "Mod",
        92: "Mod",
        93: "Mod",
        107: "=",
        109: "-",
        127: "Delete",
        173: "-",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'",
        63232: "Up",
        63233: "Down",
        63234: "Left",
        63235: "Right",
        63272: "Delete",
        63273: "Home",
        63275: "End",
        63276: "PageUp",
        63277: "PageDown",
        63302: "Insert"
    };
    C.keyNames = et;
    (function() {
        for (var fl = 0; fl < 10; fl++) {
            et[fl + 48] = et[fl + 96] = String(fl)
        }
        for (var fl = 65; fl <= 90; fl++) {
            et[fl] = String.fromCharCode(fl)
        }
        for (var fl = 1; fl <= 12; fl++) {
            et[fl + 111] = et[fl + 63235] = "F" + fl
        }
    })();

    function dn(fl, fr, fq, fp) {
        if (!fl) {
            return fp(fr, fq, "ltr")
        }
        var fo = false;
        for (var fn = 0; fn < fl.length;
            ++fn) {
            var fm = fl[fn];
            if (fm.from < fq && fm.to > fr || fr == fq && fm.to == fr) {
                fp(Math.max(fm.from, fr), Math.min(fm.to, fq), fm.level == 1 ? "rtl" : "ltr");
                fo = true
            }
        }
        if (!fo) {
            fp(fr, fq, "ltr")
        }
    }

    function cX(fl) {
        return fl.level % 2 ? fl.to : fl.from
    }

    function fg(fl) {
        return fl.level % 2 ? fl.from : fl.to
    }

    function cf(fm) {
        var fl = a(fm);
        return fl ? cX(fl[0]) : 0
    }

    function cr(fm) {
        var fl = a(fm);
        if (!fl) {
            return fm.text.length
        }
        return fg(eR(fl))
    }

    function a8(fm, fp) {
        var fn = es(fm.doc, fp);
        var fq = u(fn);
        if (fq != fn) {
            fp = bp(fq)
        }
        var fl = a(fq);
        var fo = !fl ? 0 : fl[0].level % 2 ? cr(fq) : cf(fq);
        return O(fp, fo)
    }

    function da(fn, fq) {
        var fm, fo = es(fn.doc, fq);
        while (fm = dN(fo)) {
            fo = fm.find(1, true).line;
            fq = null
        }
        var fl = a(fo);
        var fp = !fl ? fo.text.length : fl[0].level % 2 ? cf(fo) : cr(fo);
        return O(fq == null ? bp(fo) : fq, fp)
    }

    function ac(fm, fn, fl) {
        var fo = fm[0].level;
        if (fn == fo) {
            return true
        }
        if (fl == fo) {
            return false
        }
        return fn < fl
    }
    var ei;

    function aq(fl, fp) {
        ei = null;
        for (var fm = 0, fn; fm < fl.length;
            ++fm) {
            var fo = fl[fm];
            if (fo.from < fp && fo.to > fp) {
                return fm
            }
            if ((fo.from == fp || fo.to == fp)) {
                if (fn == null) {
                    fn = fm
                } else {
                    if (ac(fl, fo.level, fl[fn].level)) {
                        if (fo.from != fo.to) {
                            ei = fn
                        }
                        return fm
                    } else {
                        if (fo.from != fo.to) {
                            ei = fm
                        }
                        return fn
                    }
                }
            }
        }
        return fn
    }

    function er(fl, fo, fm, fn) {
        if (!fn) {
            return fo + fm
        }
        do {
            fo += fm
        } while (fo > 0 && eD(fl.text.charAt(fo)));
        return fo
    }

    function q(fl, fs, fn, fo) {
        var fp = a(fl);
        if (!fp) {
            return X(fl, fs, fn, fo)
        }
        var fr = aq(fp, fs),
            fm = fp[fr];
        var fq = er(fl, fs, fm.level % 2 ? -fn : fn, fo);
        for (;;) {
            if (fq > fm.from && fq < fm.to) {
                return fq
            }
            if (fq == fm.from || fq == fm.to) {
                if (aq(fp, fq) == fr) {
                    return fq
                }
                fm = fp[fr += fn];
                return (fn > 0) == fm.level % 2 ? fm.to : fm.from
            } else {
                fm = fp[fr += fn];
                if (!fm) {
                    return null
                }
                if ((fn > 0) == fm.level % 2) {
                    fq = er(fl, fm.to, -1, fo)
                } else {
                    fq = er(fl, fm.from, 1, fo)
                }
            }
        }
    }

    function X(fl, fp, fm, fn) {
        var fo = fp + fm;
        if (fn) {
            while (fo > 0 && eD(fl.text.charAt(fo))) {
                fo += fm
            }
        }
        return fo < 0 || fo > fl.text.length ? null : fo
    }
    var aW = (function() {
        var fr = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
        var fp = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";

        function fo(fv) {
            if (fv <= 247) {
                return fr.charAt(fv)
            } else {
                if (1424 <= fv && fv <= 1524) {
                    return "R"
                } else {
                    if (1536 <= fv && fv <= 1773) {
                        return fp.charAt(fv - 1536)
                    } else {
                        if (1774 <= fv && fv <= 2220) {
                            return "r"
                        } else {
                            if (8192 <= fv && fv <= 8203) {
                                return "w"
                            } else {
                                if (fv == 8204) {
                                    return "b"
                                } else {
                                    return "L"
                                }
                            }
                        }
                    }
                }
            }
        }
        var fl = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
        var fu = /[stwN]/,
            fn = /[LRr]/,
            fm = /[Lb1n]/,
            fq = /[1n]/;
        var ft = "L";

        function fs(fx, fw, fv) {
            this.level = fx;
            this.from = fw;
            this.to = fv
        }
        return function(fF) {
            if (!fl.test(fF)) {
                return false
            }
            var fL = fF.length,
                fB = [];
            for (var fK = 0, fx; fK < fL;
                ++fK) {
                fB.push(fx = fo(fF.charCodeAt(fK)))
            }
            for (var fK = 0, fE = ft; fK < fL;
                ++fK) {
                var fx = fB[fK];
                if (fx == "m") {
                    fB[fK] = fE
                } else {
                    fE = fx
                }
            }
            for (var fK = 0, fv = ft; fK < fL;
                ++fK) {
                var fx = fB[fK];
                if (fx == "1" && fv == "r") {
                    fB[fK] = "n"
                } else {
                    if (fn.test(fx)) {
                        fv = fx;
                        if (fx == "r") {
                            fB[fK] = "R"
                        }
                    }
                }
            }
            for (var fK = 1, fE = fB[0]; fK < fL - 1;
                ++fK) {
                var fx = fB[fK];
                if (fx == "+" && fE == "1" && fB[fK + 1] == "1") {
                    fB[fK] = "1"
                } else {
                    if (fx == "," && fE == fB[fK + 1] && (fE == "1" || fE == "n")) {
                        fB[fK] = fE
                    }
                }
                fE = fx
            }
            for (var fK = 0; fK < fL;
                ++fK) {
                var fx = fB[fK];
                if (fx == ",") {
                    fB[fK] = "N"
                } else {
                    if (fx == "%") {
                        for (var fy = fK + 1; fy < fL && fB[fy] == "%";
                            ++fy) {}
                        var fM = (fK && fB[fK - 1] == "!") || (fy < fL && fB[fy] == "1") ? "1" : "N";
                        for (var fI = fK; fI < fy;
                            ++fI) {
                            fB[fI] = fM
                        }
                        fK = fy - 1
                    }
                }
            }
            for (var fK = 0, fv = ft; fK < fL;
                ++fK) {
                var fx = fB[fK];
                if (fv == "L" && fx == "1") {
                    fB[fK] = "L"
                } else {
                    if (fn.test(fx)) {
                        fv = fx
                    }
                }
            }
            for (var fK = 0; fK < fL;
                ++fK) {
                if (fu.test(fB[fK])) {
                    for (var fy = fK + 1; fy < fL && fu.test(fB[fy]);
                        ++fy) {}
                    var fC = (fK ? fB[fK - 1] : ft) == "L";
                    var fw = (fy < fL ? fB[fy] : ft) == "L";
                    var fM = fC || fw ? "L" : "R";
                    for (var fI = fK; fI < fy;
                        ++fI) {
                        fB[fI] = fM
                    }
                    fK = fy - 1
                }
            }
            var fJ = [],
                fG;
            for (var fK = 0; fK < fL;) {
                if (fm.test(fB[fK])) {
                    var fz = fK;
                    for (++fK; fK < fL && fm.test(fB[fK]);
                        ++fK) {}
                    fJ.push(new fs(0, fz, fK))
                } else {
                    var fA = fK,
                        fD = fJ.length;
                    for (++fK; fK < fL && fB[fK] != "L";
                        ++fK) {}
                    for (var fI = fA; fI < fK;) {
                        if (fq.test(fB[fI])) {
                            if (fA < fI) {
                                fJ.splice(fD, 0, new fs(1, fA, fI))
                            }
                            var fH = fI;
                            for (++fI; fI < fK && fq.test(fB[fI]);
                                ++fI) {}
                            fJ.splice(fD, 0, new fs(2, fH, fI));
                            fA = fI
                        } else {
                            ++fI
                        }
                    }
                    if (fA < fK) {
                        fJ.splice(fD, 0, new fs(1, fA, fK))
                    }
                }
            }
            if (fJ[0].level == 1 && (fG = fF.match(/^\s+/))) {
                fJ[0].from = fG[0].length;
                fJ.unshift(new fs(0, 0, fG[0].length))
            }
            if (eR(fJ).level == 1 && (fG = fF.match(/\s+$/))) {
                eR(fJ).to -= fG[0].length;
                fJ.push(new fs(0, fL - fG[0].length, fL))
            }
            if (fJ[0].level != eR(fJ).level) {
                fJ.push(new fs(fJ[0].level, fL, fL))
            }
            return fJ
        }
    })();
    C.version = "4.0.0";
    return C
});
(function() {
    CodeMirror.switchSlackMode = function(f, g) {
        var e = {
            php: ["php", "application/x-httpd-php"],
            sql: ["sql", "text/x-sql"],
            mysql: ["sql", "text/x-mysql"],
            html: ["htmlmixed", "text/html"],
            javascript: ["javascript", "text/javascript"],
            markdown: ["markdown", "text/x-markdown"],
            c: ["clike", "text/x-csrc"],
            cpp: ["clike", "text/x-c++src"],
            csharp: ["clike", "text/x-csharp"],
            vb: ["vb", "text/x-vb"],
            vbscript: ["vbscript", "text/vbscript"],
            java: ["clike", "text/x-java"],
            css: ["css", "text/css"],
            perl: ["perl", "text/x-perl"],
            python: ["python", "text/x-python"],
            ruby: ["ruby", "text/x-ruby"],
            erlang: ["erlang", "text/x-erlang"],
            diff: ["diff", "text/x-diff"],
            xml: ["xml", "text/xml"],
            coffeescript: ["coffeescript", "text/x-coffeescript"],
            clojure: ["clojure", "text/x-clojure"],
            scheme: ["scheme", "text/x-scheme"],
            haskell: ["haskell", "text/x-haskell"],
            scala: ["clike", "text/x-scala"],
            shell: ["shell", "text/x-sh"],
            go: ["go", "text/x-go"],
            groovy: ["groovy", "text/x-groovy"],
            yaml: ["yaml", "text/x-yaml"],
            lua: ["lua", "text/x-lua"],
            matlab: ["octave", "text/x-octave"],
            r: ["r", "text/x-rsrc"],
            puppet: ["puppet", "text/x-puppet"],
            smalltalk: ["smalltalk", "text/x-stsrc"]
        };
        if (e[g]) {
            f.setOption("mode", e[g][1]);
            CodeMirror.autoLoadMode(f, e[g][0])
        } else {
            f.setOption("mode", null)
        }
    };

    function c(e) {
        switch (e) {
            case "apl":
                return "https://assets.slack.com/18919/js/libs_codemirror_apl_1398187508.js";
            case "asterisk":
                return "https://assets.slack.com/18919/js/libs_codemirror_asterisk_1398187513.js";
            case "clike":
                return "https://assets.slack.com/18919/js/libs_codemirror_clike_1398187596.js";
            case "clojure":
                return "https://assets.slack.com/18919/js/libs_codemirror_clojure_1398187491.js";
            case "cobol":
                return "https://assets.slack.com/18919/js/libs_codemirror_cobol_1398187443.js";
            case "coffeescript":
                return "https://assets.slack.com/18919/js/libs_codemirror_coffeescript_1398187423.js";
            case "commonlisp":
                return "https://assets.slack.com/18919/js/libs_codemirror_commonlisp_1398187557.js";
            case "css":
                return "https://assets.slack.com/18919/js/libs_codemirror_css_1398187537.js";
            case "d":
                return "https://assets.slack.com/18919/js/libs_codemirror_d_1398187385.js";
            case "diff":
                return "https://assets.slack.com/18919/js/libs_codemirror_diff_1398187586.js";
            case "dtd":
                return "https://assets.slack.com/18919/js/libs_codemirror_dtd_1398187678.js";
            case "ecl":
                return "https://assets.slack.com/18919/js/libs_codemirror_ecl_1398187754.js";
            case "eiffel":
                return "https://assets.slack.com/18919/js/libs_codemirror_eiffel_1398187750.js";
            case "erlang":
                return "https://assets.slack.com/18919/js/libs_codemirror_erlang_1398187527.js";
            case "fortran":
                return "https://assets.slack.com/18919/js/libs_codemirror_fortran_1398187568.js";
            case "gas":
                return "https://assets.slack.com/18919/js/libs_codemirror_gas_1398187689.js";
            case "gfm":
                return "https://assets.slack.com/18919/js/libs_codemirror_gfm_1398187732.js";
            case "gherkin":
                return "https://assets.slack.com/18919/js/libs_codemirror_gherkin_1398187698.js";
            case "go":
                return "https://assets.slack.com/18919/js/libs_codemirror_go_1398187703.js";
            case "groovy":
                return "https://assets.slack.com/18919/js/libs_codemirror_groovy_1398187462.js";
            case "haml":
                return "https://assets.slack.com/18919/js/libs_codemirror_haml_1398187737.js";
            case "haskell":
                return "https://assets.slack.com/18919/js/libs_codemirror_haskell_1398187668.js";
            case "haxe":
                return "https://assets.slack.com/18919/js/libs_codemirror_haxe_1398187496.js";
            case "htmlembedded":
                return "https://assets.slack.com/18919/js/libs_codemirror_htmlembedded_1398187637.js";
            case "htmlmixed":
                return "https://assets.slack.com/18919/js/libs_codemirror_htmlmixed_1398187693.js";
            case "http":
                return "https://assets.slack.com/18919/js/libs_codemirror_http_1398187552.js";
            case "jade":
                return "https://assets.slack.com/18919/js/libs_codemirror_jade_1398187611.js";
            case "javascript":
                return "https://assets.slack.com/18919/js/libs_codemirror_javascript_1398187396.js";
            case "jinja2":
                return "https://assets.slack.com/18919/js/libs_codemirror_jinja2_1398187616.js";
            case "julia":
                return "https://assets.slack.com/18919/js/libs_codemirror_julia_1398187723.js";
            case "livescript":
                return "https://assets.slack.com/18919/js/libs_codemirror_livescript_1398187657.js";
            case "lua":
                return "https://assets.slack.com/18919/js/libs_codemirror_lua_1398187427.js";
            case "markdown":
                return "https://assets.slack.com/18919/js/libs_codemirror_markdown_1398187662.js";
            case "mirc":
                return "https://assets.slack.com/18919/js/libs_codemirror_mirc_1398187487.js";
            case "mllike":
                return "https://assets.slack.com/18919/js/libs_codemirror_mllike_1398187647.js";
            case "nginx":
                return "https://assets.slack.com/18919/js/libs_codemirror_nginx_1398187601.js";
            case "ntriples":
                return "https://assets.slack.com/18919/js/libs_codemirror_ntriples_1398187591.js";
            case "octave":
                return "https://assets.slack.com/18919/js/libs_codemirror_octave_1398187563.js";
            case "pascal":
                return "https://assets.slack.com/18919/js/libs_codemirror_pascal_1398187471.js";
            case "pegjs":
                return "https://assets.slack.com/18919/js/libs_codemirror_pegjs_1398187390.js";
            case "perl":
                return "https://assets.slack.com/18919/js/libs_codemirror_perl_1398187605.js";
            case "php":
                return "https://assets.slack.com/18919/js/libs_codemirror_php_1398187532.js";
            case "pig":
                return "https://assets.slack.com/18919/js/libs_codemirror_pig_1398187652.js";
            case "properties":
                return "https://assets.slack.com/18919/js/libs_codemirror_properties_1398187518.js";
            case "puppet":
                return "https://assets.slack.com/18919/js/libs_codemirror_puppet_1398187547.js";
            case "python":
                return "https://assets.slack.com/18919/js/libs_codemirror_python_1398187713.js";
            case "q":
                return "https://assets.slack.com/18919/js/libs_codemirror_q_1398187501.js";
            case "r":
                return "https://assets.slack.com/18919/js/libs_codemirror_r_1398187727.js";
            case "rpm":
                return "https://assets.slack.com/18919/js/libs_codemirror_rpm_1398187577.js";
            case "rst":
                return "https://assets.slack.com/18919/js/libs_codemirror_rst_1398187642.js";
            case "ruby":
                return "https://assets.slack.com/18919/js/libs_codemirror_ruby_1398187684.js";
            case "rust":
                return "https://assets.slack.com/18919/js/libs_codemirror_rust_1398187417.js";
            case "sass":
                return "https://assets.slack.com/18919/js/libs_codemirror_sass_1398187543.js";
            case "scheme":
                return "https://assets.slack.com/18919/js/libs_codemirror_scheme_1398187708.js";
            case "shell":
                return "https://assets.slack.com/18919/js/libs_codemirror_shell_1398187467.js";
            case "sieve":
                return "https://assets.slack.com/18919/js/libs_codemirror_sieve_1398187432.js";
            case "smalltalk":
                return "https://assets.slack.com/18919/js/libs_codemirror_smalltalk_1398187408.js";
            case "smarty":
                return "https://assets.slack.com/18919/js/libs_codemirror_smarty_1398187403.js";
            case "smartymixed":
                return "https://assets.slack.com/18919/js/libs_codemirror_smartymixed_1398187633.js";
            case "sparql":
                return "https://assets.slack.com/18919/js/libs_codemirror_sparql_1398187742.js";
            case "sql":
                return "https://assets.slack.com/18919/js/libs_codemirror_sql_1398187673.js";
            case "stex":
                return "https://assets.slack.com/18919/js/libs_codemirror_stex_1398187582.js";
            case "tcl":
                return "https://assets.slack.com/18919/js/libs_codemirror_tcl_1398187458.js";
            case "tiddlywiki":
                return "https://assets.slack.com/18919/js/libs_codemirror_tiddlywiki_1398187478.js";
            case "tiki":
                return "https://assets.slack.com/18919/js/libs_codemirror_tiki_1398187759.js";
            case "toml":
                return "https://assets.slack.com/18919/js/libs_codemirror_toml_1398187482.js";
            case "turtle":
                return "https://assets.slack.com/18919/js/libs_codemirror_turtle_1398187623.js";
            case "vb":
                return "https://assets.slack.com/18919/js/libs_codemirror_vb_1398187437.js";
            case "vbscript":
                return "https://assets.slack.com/18919/js/libs_codemirror_vbscript_1398187448.js";
            case "velocity":
                return "https://assets.slack.com/18919/js/libs_codemirror_velocity_1398187413.js";
            case "verilog":
                return "https://assets.slack.com/18919/js/libs_codemirror_verilog_1398187718.js";
            case "xml":
                return "https://assets.slack.com/18919/js/libs_codemirror_xml_1398187522.js";
            case "xquery":
                return "https://assets.slack.com/18919/js/libs_codemirror_xquery_1398187628.js";
            case "yaml":
                return "https://assets.slack.com/18919/js/libs_codemirror_yaml_1398187573.js";
            case "z80":
                return "https://assets.slack.com/18919/js/libs_codemirror_z80_1398187453.js"
        }
        return null
    }
    var d = {};

    function b(e, g) {
        var f = g;
        return function() {
            if (--f == 0) {
                e()
            }
        }
    }

    function a(k, e) {
        var j = CodeMirror.modes[k].dependencies;
        if (!j) {
            return e()
        }
        var h = [];
        for (var g = 0; g < j.length;
            ++g) {
            if (!CodeMirror.modes.hasOwnProperty(j[g])) {
                h.push(j[g])
            }
        }
        if (!h.length) {
            return e()
        }
        var f = b(e, h.length);
        for (var g = 0; g < h.length;
            ++g) {
            CodeMirror.requireMode(h[g], f)
        }
    }
    CodeMirror.requireMode = function(k, e) {
        if (typeof k != "string") {
            k = k.name
        }
        if (CodeMirror.modes.hasOwnProperty(k)) {
            return a(k, e)
        }
        if (d.hasOwnProperty(k)) {
            return d[k].push(e)
        }
        var f = document.createElement("script");
        f.src = c(k);
        var g = document.getElementsByTagName("script")[0];
        g.parentNode.insertBefore(f, g);
        var i = d[k] = [e];
        var h = 0,
            j = setInterval(function() {
                if (++h > 100) {
                    return clearInterval(j)
                }
                if (CodeMirror.modes.hasOwnProperty(k)) {
                    clearInterval(j);
                    d[k] = null;
                    a(k, function() {
                        for (var l = 0; l < i.length;
                            ++l) {
                            i[l]()
                        }
                    })
                }
            }, 200)
    };
    CodeMirror.autoLoadMode = function(e, f) {
        if (!CodeMirror.modes.hasOwnProperty(f)) {
            CodeMirror.requireMode(f, function() {
                e.setOption("mode", e.getOption("mode"))
            })
        }
    }
}());
var TS = {
    session_ms: new Date().getTime(),
    modules: {},
    boot_data: {},
    qs_args: {},
    pri: 0,
    dom_ready: false,
    module_exec_order_index: 1,
    requireds: {
        view: {
            getDivForMsg: true,
            clearMessageInput: true,
            msgs_scroller_div: true,
            msgs_div: true,
            input_el: true,
            filesSelected: true,
            focusMessageInput: true,
            clearUnreadDivider: true,
            onMsgsDivClick: true,
            updateNewMsgsDisplay: true,
            showNewMsgsJumpLink: true,
            hideNewMsgsJumpLink: true,
            last_read_msg_div: true
        }
    },
    logLoad: function(a) {
        TS.log(88, a);
        if (!window.logLoad) {
            return
        }
        window.logLoad(a)
    },
    reportLoad: function(b, c) {
        if (!window.load_log || !window.load_log.length) {
            return
        }
        if (!TS.model || !TS.model.team || TS.model.team.domain != "tinyspeck") {
            return
        }
        TS.dir(88, window.load_log);
        if (!TS.client || !TS.ims) {
            return
        }
        c = c || "short";
        b = b || window.load_log.length - 1;
        var d = window.load_log[b]["t"];
        var f = "total time: " + d + "s (at index " + b + ")";
        if (c == "complete") {
            f += "\n" + JSON.stringify(window.load_log, null, "\t");
            f += "\n<javascript:TS.reportLoad(" + b + ", 'snippet')|share this with eric as a snippet>"
        } else {
            if (c == "short") {
                f += " <javascript:TS.reportLoad(" + b + ", 'complete')|click for details>"
            } else {
                if (c == "snippet") {
                    f += "\n" + navigator.userAgent + "\nsvn_rev: " + TS.boot_data.svn_rev + "\n";
                    if ($ && $.jStorage) {
                        f += "$.jStorage.storageAvailable(): " + $.jStorage.storageAvailable() + "\n$.jStorage.storageSize(): " + $.jStorage.storageSize() + "\n$.jStorage.currentBackend(): " + $.jStorage.currentBackend() + "\n";
                        if (TS.storage) {
                            f += "TS.storage.version: " + TS.storage.version + "\nTS.storage._get('storage_version'): " + TS.storage._get("storage_version") + "\nTS.storage.msgs_version: " + TS.storage.msgs_version + "\nTS.storage._get('storage_msgs_version'): " + TS.storage._get("storage_msgs_version") + "\n"
                        }
                        if (TS.model) {
                            f += "TS.model.initial_ui_state_str: " + TS.model.initial_ui_state_str + "\n"
                        }
                    }
                    f += JSON.stringify(window.load_log, null, "\t");
                    var a = TS.ims.getImByUsername("eric");
                    TS.files.upload(f, null, null, null, "load times " + TS.utility.date.toDate(TS.utility.date.makeTsStamp()), "javascript", (a) ? [a.id] : null, "");
                    return
                } else {
                    alert("type:" + c);
                    return
                }
            }
        }
        var e = {
            type: "message",
            subtype: "bot_message",
            username: "loadBot",
            icons: {
                emoji: ":rocket:"
            },
            is_ephemeral: true,
            ts: TS.utility.date.makeTsStamp(),
            text: f
        };
        var a = TS.ims.getImByMemberId("USLACKBOT");
        if (a) {
            TS.ims.addMsg(a.id, e)
        }
    },
    delayed_module_loads: {},
    registerModule: function(d, b, c) {
        TS.last_registered_module = b;
        if (TS.dom_ready) {
            TS.error('module "' + d + '" must be registered on before dom ready');
            return
        }
        if (TS.modules[d]) {
            TS.error('module "' + d + '" already exists');
            return
        }
        var g;
        var f;
        if (d.indexOf(".") != -1) {
            var h = d.split(".");
            if (h.length > 2) {
                TS.error('module "' + d + '" cannot be registered, as we only support a depth of one sub module right now');
                return
            }
            g = h[0];
            f = h[1];
            if (!f) {
                TS.error('module "' + d + '" cannot be registered because of a bad name');
                return
            }
            if (!TS.modules[g]) {
                if (c) {
                    TS.error('module "' + d + '" cannot be registered after delay; "' + g + '" is not registered')
                } else {
                    TS.delayed_module_loads[d] = b
                }
                return
            }
            if (f in TS.modules[g]) {
                TS.error('module "' + d + '" cannot be registered; "' + f + '" already exists on "' + g + '"');
                return
            }
        }
        if (TS.requireds[d]) {
            var e = true;
            for (var a in TS.requireds[d]) {
                if (!(a in b)) {
                    TS.warn('all mudules registering as "' + d + '" must implement "' + a + '"');
                    e = false
                }
            }
            if (!e) {
                TS.error('module "' + d + '" does not implement all requireds');
                return
            }
        }
        if (g) {
            TS[g][f] = b
        } else {
            TS[d] = b
        }
        b._name = d;
        TS.modules[d] = b;
        if (!b._exec_order) {
            b._exec_order = TS.module_exec_order_index++
        }
    },
    makeLogDate: function() {
        if (window.TSMakeLogDate) {
            return TSMakeLogDate()
        }
        return "(TSMakeLogDate not loaded) "
    },
    log: function(c, a) {
        if (!window.console) {
            return
        }
        var b = (TS.pri) ? TS.pri.toString().split(",") : ["0"];
        if (c != "0" && b.indexOf(c.toString()) == -1 && b.indexOf("all") == -1) {
            return
        }
        if (typeof a == "object") {
            console.log(a)
        } else {
            console.log(TS.makeLogDate() + c + " " + a)
        }
    },
    info: function(a) {
        if (!window.console || !console.info) {
            return
        }
        console.info(TS.makeLogDate() + a)
    },
    warn: function(a) {
        if (!window.console || !console.warn) {
            return
        }
        console.warn(TS.makeLogDate() + a)
    },
    dir: function(b, a) {
        if (!window.console || !console.dir) {
            return
        }
        if (TS.utility && b) {
            if (!TS.utility.inArray(TS.pri.toString().split(","), b)) {
                return
            }
        }
        try {
            console.dir(TS.utility.clone(a))
        } catch (c) {
            TS.warn("could not dir ob:" + a + " err:" + c)
        }
    },
    error: function(a) {
        if (!window.console || !console.error) {
            return
        }
        console.error(TS.makeLogDate() + a)
    },
    logError: function(a, b) {
        if (!window.badtoys || !window.badtoys.log) {
            if (window.console && console.error) {
                console.error(TS.makeLogDate() + "no window.badtoys.log trying to log e:" + a + " desc:" + b)
            }
            return
        }
        badtoys.log(a, b);
        if (window.console && console.error) {
            console.error(TS.makeLogDate() + "logging e:" + a + " desc:" + b)
        }
    },
    track: function(a) {
        if (window.track) {
            TS.info("tracking: " + a);
            window.track(a)
        } else {
            TS.warn('could not track "' + a + '" because there is no window.track')
        }
    },
    boot: function(a) {
        TS.logLoad("TS.boot");
        TS.boot_data = a;
        TS.setQsArgs(location);
        TS.pri = (TS.qs_args.pri) ? TS.qs_args.pri + ",0" : TS.pri;
        TS.info("booted! pri:" + TS.pri);
        $(document).ready(TS.onDOMReady)
    },
    setQsArgs: function(h) {
        var c = {};
        var f;
        var a = h.search.substring(1);
        f = a.split("&");
        for (var d = 0; d < f.length; d++) {
            var g = f[d].indexOf("=");
            if (g != -1) {
                var b = f[d].substring(0, g);
                var e = f[d].substring(g + 1);
                c[b] = unescape(e)
            }
        }
        TS.qs_args = c
    },
    onDOMReady: function() {
        TS.info("onDOMReady");
        if (TS.client && window.WEB_SOCKET_USING_FLASH_BUT_NO_FLASH) {
            TS.info("WEB_SOCKET_USING_FLASH_BUT_NO_FLASH");
            $("#loading_animation").addClass("hidden");
            $("#no_ws_and_bad_flash").css("display", "inline");
            $("#loading_nag").css("display", "none");
            return
        }
        if (TS.client) {
            TS.info("calling didStartLoading");
            TSSSB.call("didStartLoading", {
                ms: 30000
            }, 30000)
        } else {
            TS.info("no TS.client on page:" + document.location.href)
        }
        TS.logLoad("TS.onDOMReady");
        TS.info("soundManager.setup called");
        soundManager.setup({
            url: "/img/sm/",
            debugMode: false,
            preferFlash: false,
            onready: function() {
                TS.info("soundManager.onready called")
            }
        });
        var a = new XMLHttpRequest();
        a.onreadystatechange = function() {
            if (a.readyState == 4) {
                if (a.status == 200) {
                    a.onreadystatechange = null;
                    $("body").append(a.responseText);
                    TS.onTemplatesLoaded()
                } else {}
            }
        };
        a.open("GET", "/templates.php?cb=" + TS.boot_data.svn_rev, 1);
        a.send()
    },
    async_js_loaded: 0,
    onTemplatesLoaded: function() {
        TS.logLoad("TS.onTemplatesLoaded");
        if (TS.client) {
            TSSSB.call("didStartLoading", {
                ms: 30000
            }, 30000)
        }
        var a = window.async_css_urls || [];
        var c = true;

        function d(f) {
            var e = a[f] + "?cb=" + window.location.hostname;
            TS.logLoad("TS loading: " + e);
            var h = new Date().getTime();
            var g = new XMLHttpRequest();
            g.onreadystatechange = function() {
                if (g.readyState == 4) {
                    if (g.status == 200) {
                        g.onreadystatechange = null;
                        TS.async_css_loaded++;
                        TS.logLoad("TS loaded (" + (new Date().getTime() - h) + "ms) " + e);
                        $("head").append('<style type="text/css">' + g.responseText + "<style>");
                        if (TS.async_css_loaded == a.length) {
                            TS.onAsyncCSSLoaded()
                        } else {
                            if (TS.async_css_loaded > a.length) {
                                alert("bad! TS.async_css_loaded > A.length")
                            } else {
                                if (!c) {
                                    d(f + 1)
                                }
                            }
                        }
                    } else {}
                }
            };
            g.open("GET", e, 1);
            g.send()
        }
        if (a.length) {
            if (c) {
                for (var b = 0; b < a.length; b++) {
                    d(b)
                }
            } else {
                d(0)
            }
        } else {
            TS.onAsyncCSSLoaded()
        }
    },
    async_css_loaded: 0,
    onAsyncCSSLoaded: function() {
        TS.logLoad("TS.onAsyncCSSLoaded");
        if (TS.client) {
            TSSSB.call("didStartLoading", {
                ms: 30000
            }, 30000)
        }
        var a = window.async_js_urls || [];
        var c = true;

        function d(f) {
            var e = a[f];
            TS.logLoad("TS loading: " + e);
            var g = new Date().getTime();
            $.ajax({
                url: e,
                dataType: "script",
                cache: true,
                success: function(i, j, h) {
                    TS.async_js_loaded++;
                    TS.logLoad("TS loaded " + TS.async_js_loaded + " of " + a.length + " (" + (new Date().getTime() - g) + "ms) " + e);
                    TS.last_registered_module._exec_order = f;
                    if (TS.async_js_loaded == a.length) {
                        TS.onAsyncJSLoaded()
                    } else {
                        if (TS.async_js_loaded > a.length) {
                            alert("bad! TS.async_js_loaded > A.length")
                        } else {
                            if (!c) {
                                d(f + 1)
                            }
                        }
                    }
                }
            })
        }
        if (a.length) {
            if (c) {
                for (var b = 0; b < a.length; b++) {
                    d(b)
                }
            } else {
                d(0)
            }
        } else {
            TS.onAsyncJSLoaded()
        }
    },
    onAsyncJSLoaded: function() {
        TS.logLoad("TS.onAsyncJSLoaded");
        emoji.include_title = true;
        emoji.allow_native = false;
        for (var a in TS.delayed_module_loads) {
            TS.registerModule(a, TS.delayed_module_loads[a], true)
        }
        TS.storage.onStart();
        TS.storage.onStart = function() {};
        if (TS.boot_data.app == "client") {
            TS.client.onStart();
            TS.client.onStart = function() {}
        } else {
            if (TS.boot_data.app == "web" || TS.boot_data.app == "mobile") {
                TS.web.onStart();
                TS.web.onStart = function() {}
            } else {
                TS.error("WTF app? " + TS.boot_data.app);
                return
            }
        }
        TS.callModuleMethod("onStart", true);
        TS.dom_ready = true;
        if (TS.client) {
            TSSSB.call("didStartLoading", {
                ms: 60000
            }, 60000)
        }
        TS.setUpEmoji(function() {
            if (TS.boot_data.app == "client") {
                TS.client.gogogo()
            } else {
                if (TS.boot_data.app == "web" || TS.boot_data.app == "mobile") {
                    TS.web.gogogo()
                }
            }
        })
    },
    setUpEmoji: function(b) {
        if (!window.emoji) {
            return b()
        }
        emoji.include_text = true;
        if (emoji.unaltered_data) {
            emoji.data = TS.utility.clone(emoji.unaltered_data);
            emoji.inits = {}
        } else {
            emoji.unaltered_data = TS.utility.clone(emoji.data)
        }
        emoji.init_colons();
        if (!TS.boot_data.page_needs_custom_emoji) {
            return b()
        }
        var a = false;
        TS.api.call("emoji.list", {}, function(g, h, f) {
            if (emoji && g) {
                TS.model.all_custom_emoji.length = 0;
                var c = h.emoji;
                var i;
                var d;
                var e;
                for (e in c) {
                    if (c[e].indexOf("alias:") == 0) {
                        continue
                    }
                    emoji.data[e] = [null, null, null, [e], null, null, null, c[e]];
                    emoji.map.colons[e] = e;
                    TS.model.all_custom_emoji.push(e)
                }
                for (e in c) {
                    if (c[e].indexOf("alias:") != 0) {
                        continue
                    }
                    i = c[e].replace("alias:", "");
                    d = emoji.data[i];
                    if (d) {
                        d[3].push(e);
                        emoji.map.colons[e] = i;
                        if (a) {
                            TS.model.all_custom_emoji.push(e)
                        }
                        continue
                    }
                    i = emoji.map.colons[i];
                    d = emoji.data[i];
                    if (d) {
                        d[3].push(e);
                        emoji.map.colons[e] = i;
                        if (a) {
                            TS.model.all_custom_emoji.push(e)
                        }
                        continue
                    }
                    TS.warn('alias for "' + e + '":"' + c[e] + '" not recognized')
                }
            }
            TS.model.all_custom_emoji = TS.model.all_custom_emoji.sort();
            if (b) {
                b()
            }
        })
    },
    setUpModel: function(c) {
        var k = !TS.model.logged_in_once;
        TS.model.team = c.team;
        TS.model.bots_legacy = c.team.bots;
        TS.model.team.url = c.url;
        if (!TS.model.last_team_name) {
            TS.model.last_team_name = TS.model.team.name;
            TS.model.last_team_domain = TS.model.team.domain
        }
        TS.model.team.activity = [];
        if (TS.model.break_token) {
            TS.model.team.url += "f"
        }
        if (TS.model.break_reconnections) {
            TS.model.team.url = TS.model.team.url.replace("websocket", "BUSTED")
        }
        if (k) {
            TS.model.bots = [];
            TS.model.members = [];
            TS.model.channels = [];
            TS.model.ims = [];
            TS.model.groups = []
        } else {
            TS.refreshTeams()
        }
        TS.prefs.setPrefs(c.self.prefs);
        delete c.self.prefs;
        var d;
        var b;
        if (!c.members) {
            c.members = c.users
        }
        for (d = 0; d < c.members.length; d++) {
            b = c.members[d];
            var a = TS.members.upsertAndSignal(b);
            if (b.id == c.self.id) {
                TS.model.user = a.member;
                TS.model.user.is_self = true;
                TS.members.upsertMember(c.self)
            }
        }
        var g;
        for (d = 0; d < c.bots.length; d++) {
            g = c.bots[d];
            var a = TS.bots.upsertAndSignal(g)
        }
        if (!c.commands) {
            c.commands = {
                remind: {
                    id: "S12345",
                    name: "remind",
                    desc: "set a slackbot reminder",
                    help_text: "Sets a Slackbot reminder to do [action] after [timeframe]. Slackbot will send you a direct message at that time. For example: '/remind me in 5 minutes to complete my TPS report'",
                    usage: "me in [timeframe] to [action]"
                },
                discon: {
                    id: "S12346",
                    name: "discon",
                    desc: "fake",
                    help_text: "fake",
                    usage: "fake"
                }
            }
        }
        if (c.commands) {
            TS.cmd_handlers.mergeInServerCmds(c.commands)
        }
        if (k) {
            TS.prefs.setHighlightWords(TS.model.prefs.highlight_words)
        }
        var f = 0;
        var e;
        for (d = 0; d < c.channels.length; d++) {
            e = c.channels[d];
            e.all_read_this_session_once = false;
            if (TS.qs_args.just_general == "1" && !e.is_general) {
                continue
            }
            TS.channels.upsertChannel(e);
            if (e.is_member) {
                f++
            }
        }
        var j;
        for (d = 0; d < c.ims.length; d++) {
            j = c.ims[d];
            j.all_read_this_session_once = false;
            if (TS.qs_args.just_general == "1") {
                continue
            }
            TS.ims.upsertIm(j);
            if (j.is_open) {
                f++
            }
        }
        var l;
        for (d = 0; d < c.groups.length; d++) {
            l = c.groups[d];
            l.all_read_this_session_once = false;
            if (TS.qs_args.just_general == "1") {
                continue
            }
            TS.groups.upsertGroup(l);
            if (l.is_open && !l.is_archived) {
                f++
            }
        }
        TS.info("open channels/groups/ims:" + f);
        if (!k) {}
        if (TS.qs_args.api_count) {
            TS.model.initial_msgs_cnt = parseInt(TS.qs_args.api_count) || TS.model.initial_msgs_cnt
        } else {
            if (f < 10) {
                TS.model.initial_msgs_cnt = 200
            } else {
                if (f < 20) {
                    TS.model.initial_msgs_cnt = 180
                } else {
                    if (f < 30) {
                        TS.model.initial_msgs_cnt = 160
                    } else {
                        if (f < 40) {
                            TS.model.initial_msgs_cnt = 140
                        } else {
                            if (f < 50) {
                                TS.model.initial_msgs_cnt = 120
                            } else {
                                TS.model.initial_msgs_cnt = 100
                            }
                        }
                    }
                }
            }
        }
        var h = TS.model.hard_msg_limit;
        TS.model.subsequent_msgs_cnt = Math.min(h, TS.model.initial_msgs_cnt * 2);
        TS.model.special_initial_msgs_cnt = Math.min(h, TS.model.initial_msgs_cnt * 2);
        TS.info("initial_msgs_cnt:" + TS.model.initial_msgs_cnt);
        TS.info("subsequent_msgs_cnt:" + TS.model.subsequent_msgs_cnt);
        TS.info("special_initial_msgs_cnt:" + TS.model.special_initial_msgs_cnt)
    },
    setThemeClasses: function(a) {
        $("body").removeClass("dense_theme light_theme");
        if (TS.model.prefs.theme == "dense") {
            $("body").addClass("dense_theme")
        } else {
            if (TS.model.prefs.theme == "light") {
                $("body").addClass("light_theme")
            } else {
                TS.error("no theme?");
                return
            }
        }
        if (TS.model.prefs.avatars) {
            $("body").removeClass("no_avatars")
        } else {
            $("body").addClass("no_avatars")
        }
        if (TS.client && !a) {
            if (TS.shared.getActiveModelOb()) {
                TS.view.rebuildMsgs()
            }
        }
    },
    callModuleMethod: function(e, g) {
        var b;
        var d;
        var a = [];
        for (var b in TS.modules) {
            d = TS.modules[b];
            d._exec_order = d._exec_order || 0;
            a.push(d)
        }
        a.sort(function f(i, h) {
            if (i._exec_order < h._exec_order) {
                return -1
            }
            if (i._exec_order > h._exec_order) {
                return 1
            }
            return 0
        });
        for (var c = 0; c < a.length; c++) {
            d = a[c];
            if (!(e in d) || typeof d[e] != "function") {
                if (g) {
                    TS.error('module:"' + d._name + '" does not have method:"' + e + '"')
                }
                continue
            }
            TS.log(4, 'calling "' + e + '" on "' + d._name + '" _exec_order:' + d._exec_order);
            d[e]()
        }
    },
    getAllTeams: function() {
        if (!TS.boot_data) {
            return null
        }
        if (!TS.model) {
            return null
        }
        if (!TS.model.team) {
            return null
        }
        if (!TS.model.user) {
            return null
        }
        var a = [{
            id: TS.model.user.id,
            name: TS.model.user.name,
            team_id: TS.model.team.id,
            team_name: TS.model.team.name,
            team_url: "https://" + TS.model.team.domain + ".slack.com/"
        }];
        if (TS.boot_data.other_accounts && typeof TS.boot_data.other_accounts == "object" && !TS.boot_data.other_accounts.length) {
            for (var b in TS.boot_data.other_accounts) {
                TS.boot_data.other_accounts[b].id = b;
                a.push(TS.boot_data.other_accounts[b])
            }
        }
        TS.info("TS.getAllTeams():");
        TS.dir(0, a);
        return a
    },
    refreshTeams: function() {
        if (!TS.boot_data) {
            return
        }
        if (!TS.model) {
            return
        }
        if (!TS.model.team) {
            return
        }
        if (!TS.model.user) {
            return
        }
        var url = "/account-list-api?token=" + TS.model.api_token;
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    req.onreadystatechange = null;
                    var data;
                    if (req.responseText.indexOf("{") == 0) {
                        try {
                            eval("data = " + req.responseText);
                            if (data.ok) {
                                TS.boot_data.other_accounts = {};
                                var c = 0;
                                for (var k in data.accounts) {
                                    if (k == TS.model.user.id) {
                                        continue
                                    }
                                    TS.boot_data.other_accounts[k] = data.accounts[k];
                                    c++
                                }
                                if (window.macgap && macgap.teams && macgap.teams.update) {
                                    TS.info("calling macgap.teams.update");
                                    macgap.teams.update(TS.getAllTeams())
                                }
                                TS.warn("c:" + c);
                                if (TS.view && !c) {
                                    TS.info("calling TS.view.updateTitleBarColor");
                                    TS.view.updateTitleBarColor()
                                }
                            }
                        } catch (err) {
                            if (window.console && console.warn && console.error) {
                                console.warn("unable to do anything with refreshTeams rsp");
                                console.error(err)
                            }
                        }
                    }
                }
            }
        };
        req.open("GET", url, 1);
        req.send()
    }
};
(function() {
    TS.registerModule("model", {
        api_url: "",
        api_token: "",
        user: null,
        team: null,
        ims: null,
        channels: null,
        groups: null,
        members: null,
        bots: null,
        files: [],
        requested_im_opens: {},
        requested_group_opens: {},
        requested_channel_joins: {},
        created_channels: {},
        created_groups: {},
        archives_and_recreated_groups: {},
        last_team_name: "",
        last_team_domain: "",
        unsent_msgs: {},
        display_unsent_msgs: {},
        inline_img_byte_limit: 2097152,
        inline_img_pixel_limit: 7360 * 4912,
        code_wrap_long_lines: true,
        last_reads_set_by_client: {},
        asleep: false,
        socket_connected: false,
        socket_connecting: false,
        logged_in_once: false,
        window_unloading: false,
        active_cid: null,
        last_active_cid: null,
        active_group_id: null,
        active_channel_id: null,
        active_im_id: null,
        active_history: [],
        all_custom_emoji: [],
        user_colors: null,
        at_channel_suppressed_channels: null,
        push_at_channel_suppressed_channels: null,
        loud_channels: null,
        never_channels: null,
        loud_channels_set: null,
        push_loud_channels: null,
        push_mention_channels: null,
        push_loud_channels_set: null,
        highlight_words: null,
        highlight_words_regex: null,
        everyone_regex: /<!everyone\b/,
        channel_regex: /<!channel\b/,
        group_regex: /<!group\b/,
        you_regex: null,
        inline_attachments: {},
        inline_imgs: {},
        inline_img_exclude_filetypes: ["gdoc", "gsheet", "gpres", "gdraw"],
        inline_videos: {},
        inline_audios: {},
        expandable_state: {},
        break_token: false,
        break_reconnections: false,
        reconnection_ms: 0,
        reconnect_time: 0,
        users_login_call_throttler: 0,
        initial_msgs_cnt: 50,
        subsequent_msgs_cnt: 100,
        special_initial_msgs_cnt: 100,
        hard_msg_limit: 500,
        input_maxlength: 4000,
        all_unread_cnt: 0,
        all_unread_highlights_cnt: 0,
        c_name_in_url: "",
        flex_name_in_url: "",
        flex_extra_in_url: "",
        flex_names: ["activity", "files", "team", "search", "stars", "mentions"],
        default_flex_name: "files",
        prefs: null,
        ui_state: null,
        input_history: null,
        input_history_index: -1,
        last_net_send: 0,
        previewed_file_id: null,
        last_previewed_file_id: null,
        previewed_member_name: null,
        previewed_member_id: null,
        last_previewed_member_id: null,
        channel_name_max_length: 21,
        channel_purpose_max_length: 250,
        channel_topic_max_length: 250,
        upload_file_size_limit_bytes: 1073741824,
        msg_activity_interval: 5,
        dialog_is_showing: false,
        menu_is_showing: false,
        overlay_is_showing: false,
        seen_welcome_2_this_session: false,
        showing_welcome_2: false,
        cancelled_welcome_2_this_session: false,
        show_inline_img_size_pref_reminder: false,
        shown_inline_img_size_pref_reminder_once: false,
        collapse_trigger_w: 30,
        group_prefix: "",
        allow_invite_to_group_from_person: false,
        conn_log: [],
        is_iOS: (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false),
        is_FF: (navigator.userAgent.match(/(Firefox)/g) ? true : false),
        is_chrome: (navigator.userAgent.match(/(Chrome)/g) ? true : false),
        is_safari_desktop: (navigator.userAgent.match(/(Safari)/g) && !navigator.userAgent.match(/(Chrome)/g) && navigator.userAgent.match(/(OS X)/g) ? true : false),
        is_apple_webkit_5: false,
        is_mac: (navigator.userAgent.match(/(OS X)/g) ? true : false),
        is_win: (navigator.appVersion.indexOf("Win") !== -1),
        is_ms_tablet: (navigator.appVersion.indexOf("Win") !== -1 && navigator.userAgent.match(/arm|touch/i)),
        is_our_app: (navigator.userAgent.match(/(Slack)/g) ? true : false),
        mac_ssb_version: null,
        win_ssb_version: null,
        active_file_list_filter: "all",
        active_file_list_member_filter: "all",
        file_list_types: null,
        shift_key_pressed: false,
        insert_key_pressed: false,
        alt_key_pressed: false,
        file_list_type_map: {
            all: "All File Types",
            posts: "Posts",
            snippets: "Snippets",
            images: "Images",
            pdfs: "PDF Files",
            gdocs: "Google Docs"
        },
        welcome_model_ob: {},
        change_channels_when_offline: true,
        onStart: function() {
            TS.model.makeYouReqex();
            if (navigator.userAgent.match(/(Slack_SSB)/g)) {
                var g = navigator.userAgent.split("/");
                TS.model.mac_ssb_version = parseFloat(g[g.length - 1])
            }
            if (navigator.userAgent.match(/(Slack_WINSSB)/g)) {
                var g = navigator.userAgent.split("/");
                TS.model.win_ssb_version = parseFloat(g[g.length - 1])
            }
            var e = navigator.userAgent.split("AppleWebKit/");
            if (e.length > 1) {
                var a = parseFloat(e[1]);
                TS.model.is_apple_webkit_5 = a < 536
            }
            TS.model.api_url = TS.boot_data.api_url;
            TS.model.async_api_url = TS.boot_data.async_api_url;
            TS.model.api_token = TS.boot_data.api_token;
            TS.model.webhook_url = TS.boot_data.webhook_url;
            TS.model.expandable_state = TS.storage.fetchExpandableState();
            var d = TS.storage.fetchInlineImgState();
            var c = TS.storage.fetchInlineVideoState();
            var f = TS.storage.fetchInlineAttachmentState();
            var b;
            for (b in d) {
                if (!TS.model.expandable_state["img_" + b]) {
                    TS.model.expandable_state["img_" + b] = d[b]
                }
            }
            for (b in c) {
                if (!TS.model.expandable_state["vid_" + b]) {
                    TS.model.expandable_state["vid_" + b] = c[b]
                }
            }
            for (b in f) {
                if (!TS.model.expandable_state["attach_" + b]) {
                    TS.model.expandable_state["attach_" + b] = f[b]
                }
            }
            TS.storage.storeInlineImgState({});
            TS.storage.storeInlineVideoState({});
            TS.storage.storeInlineAttachmentState({})
        },
        makeYouReqex: function() {
            var a = (TS.boot_data.login_data) ? TS.boot_data.login_data.self : TS.model.user;
            if (a) {
                TS.model.you_regex = new RegExp("<@(" + a.id + "|" + a.name + ")\\b")
            }
        },
        addProfilingKeyTime: function(b, a) {
            if (!a || !b) {
                return
            }
            if (!TS.model.profiling_key_times) {
                TS.model.profiling_key_times = []
            }
            TS.model.profiling_key_times.push({
                name: b,
                ms: a
            })
        }
    })
}());
(function(a, b) {
    if (typeof exports == "object") {
        module.exports = b()
    } else {
        if (typeof define == "function" && define.amd) {
            define(b)
        } else {
            a.Spinner = b()
        }
    }
}(this, function() {
    var e = ["webkit", "Moz", "ms", "O"],
        p = {},
        o;

    function g(q, t) {
        var r = document.createElement(q || "div"),
            s;
        for (s in t) {
            r[s] = t[s]
        }
        return r
    }

    function h(r) {
        for (var q = 1, s = arguments.length; q < s; q++) {
            r.appendChild(arguments[q])
        }
        return r
    }
    var i = (function() {
        var q = g("style", {
            type: "text/css"
        });
        h(document.getElementsByTagName("head")[0], q);
        return q.sheet || q.styleSheet
    }());

    function c(u, q, v, y) {
        var r = ["opacity", q, ~~(u * 100), v, y].join("-"),
            s = 0.01 + v / y * 100,
            x = Math.max(1 - (1 - u) / q * (100 - s), u),
            w = o.substring(0, o.indexOf("Animation")).toLowerCase(),
            t = w && "-" + w + "-" || "";
        if (!p[r]) {
            i.insertRule("@" + t + "keyframes " + r + "{0%{opacity:" + x + "}" + s + "%{opacity:" + u + "}" + (s + 0.01) + "%{opacity:1}" + (s + q) % 100 + "%{opacity:" + u + "}100%{opacity:" + x + "}}", i.cssRules.length);
            p[r] = 1
        }
        return r
    }

    function m(u, v) {
        var t = u.style,
            q, r;
        v = v.charAt(0).toUpperCase() + v.slice(1);
        for (r = 0; r < e.length; r++) {
            q = e[r] + v;
            if (t[q] !== undefined) {
                return q
            }
        }
        if (t[v] !== undefined) {
            return v
        }
    }

    function f(q, s) {
        for (var r in s) {
            q.style[m(q, r) || r] = s[r]
        }
        return q
    }

    function k(s) {
        for (var q = 1; q < arguments.length; q++) {
            var r = arguments[q];
            for (var t in r) {
                if (s[t] === undefined) {
                    s[t] = r[t]
                }
            }
        }
        return s
    }

    function j(q) {
        var r = {
            x: q.offsetLeft,
            y: q.offsetTop
        };
        while ((q = q.offsetParent)) {
            r.x += q.offsetLeft, r.y += q.offsetTop
        }
        return r
    }

    function n(r, q) {
        return typeof r == "string" ? r : r[q % r.length]
    }
    var d = {
        lines: 12,
        length: 7,
        width: 5,
        radius: 10,
        rotate: 0,
        corners: 1,
        color: "#000",
        direction: 1,
        speed: 1,
        trail: 100,
        opacity: 1 / 4,
        fps: 20,
        zIndex: 2000000000,
        className: "spinner",
        top: "auto",
        left: "auto",
        position: "relative"
    };

    function b(q) {
        if (typeof this == "undefined") {
            return new b(q)
        }
        this.opts = k(q || {}, b.defaults, d)
    }
    b.defaults = {};
    k(b.prototype, {
        spin: function(z) {
            this.stop();
            var D = this,
                r = D.opts,
                s = D.el = f(g(0, {
                    className: r.className
                }), {
                    position: r.position,
                    width: 0,
                    zIndex: r.zIndex
                }),
                C = r.radius + r.length + r.width,
                E, B;
            if (z) {
                z.insertBefore(s, z.firstChild || null);
                B = j(z);
                E = j(s);
                f(s, {
                    left: (r.left == "auto" ? B.x - E.x + (z.offsetWidth >> 1) : parseInt(r.left, 10) + C) + "px",
                    top: (r.top == "auto" ? B.y - E.y + (z.offsetHeight >> 1) : parseInt(r.top, 10) + C) + "px"
                })
            }
            s.setAttribute("role", "progressbar");
            D.lines(s, D.opts);
            if (!o) {
                var w = 0,
                    q = (r.lines - 1) * (1 - r.direction) / 2,
                    v, t = r.fps,
                    y = t / r.speed,
                    x = (1 - r.opacity) / (y * r.trail / 100),
                    A = y / r.lines;
                (function u() {
                    w++;
                    for (var F = 0; F < r.lines; F++) {
                        v = Math.max(1 - (w + (r.lines - F) * A) % y * x, r.opacity);
                        D.opacity(s, F * r.direction + q, v, r)
                    }
                    D.timeout = D.el && setTimeout(u, ~~(1000 / t))
                })()
            }
            return D
        },
        stop: function() {
            var q = this.el;
            if (q) {
                clearTimeout(this.timeout);
                if (q.parentNode) {
                    q.parentNode.removeChild(q)
                }
                this.el = undefined
            }
            return this
        },
        lines: function(s, u) {
            var r = 0,
                v = (u.lines - 1) * (1 - u.direction) / 2,
                q;

            function t(w, x) {
                return f(g(), {
                    position: "absolute",
                    width: (u.length + u.width) + "px",
                    height: u.width + "px",
                    background: w,
                    boxShadow: x,
                    transformOrigin: "left",
                    transform: "rotate(" + ~~(360 / u.lines * r + u.rotate) + "deg) translate(" + u.radius + "px,0)",
                    borderRadius: (u.corners * u.width >> 1) + "px"
                })
            }
            for (; r < u.lines; r++) {
                q = f(g(), {
                    position: "absolute",
                    top: 1 + ~(u.width / 2) + "px",
                    transform: u.hwaccel ? "translate3d(0,0,0)" : "",
                    opacity: u.opacity,
                    animation: o && c(u.opacity, u.trail, v + r * u.direction, u.lines) + " " + 1 / u.speed + "s linear infinite"
                });
                if (u.shadow) {
                    h(q, f(t("#000", "0 0 4px #000"), {
                        top: 2 + "px"
                    }))
                }
                h(s, h(q, t(n(u.color, r), "0 0 1px rgba(0,0,0,.1)")))
            }
            return s
        },
        opacity: function(r, q, s) {
            if (q < r.childNodes.length) {
                r.childNodes[q].style.opacity = s
            }
        }
    });

    function l() {
        function q(s, r) {
            return g("<" + s + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', r)
        }
        i.addRule(".spin-vml", "behavior:url(#default#VML)");
        b.prototype.lines = function(v, u) {
            var t = u.length + u.width,
                B = 2 * t;

            function A() {
                return f(q("group", {
                    coordsize: B + " " + B,
                    coordorigin: -t + " " + -t
                }), {
                    width: B,
                    height: B
                })
            }
            var w = -(u.width + u.length) * 2 + "px",
                z = f(A(), {
                    position: "absolute",
                    top: w,
                    left: w
                }),
                y;

            function x(s, r, C) {
                h(z, h(f(A(), {
                    rotation: 360 / u.lines * s + "deg",
                    left: ~~r
                }), h(f(q("roundrect", {
                    arcsize: u.corners
                }), {
                    width: t,
                    height: u.width,
                    left: u.radius,
                    top: -u.width >> 1,
                    filter: C
                }), q("fill", {
                    color: n(u.color, s),
                    opacity: u.opacity
                }), q("stroke", {
                    opacity: 0
                }))))
            }
            if (u.shadow) {
                for (y = 1; y <= u.lines; y++) {
                    x(y, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)")
                }
            }
            for (y = 1; y <= u.lines; y++) {
                x(y)
            }
            return h(v, z)
        };
        b.prototype.opacity = function(s, r, u, t) {
            var v = s.firstChild;
            t = t.shadow && t.lines || 0;
            if (v && r + t < v.childNodes.length) {
                v = v.childNodes[r + t];
                v = v && v.firstChild;
                v = v && v.firstChild;
                if (v) {
                    v.opacity = u
                }
            }
        }
    }
    var a = f(g("group"), {
        behavior: "url(#default#VML)"
    });
    if (!m(a, "transform") && a.adj) {
        l()
    } else {
        o = m(a, "animation")
    }
    return b
}));
/*!
 * Ladda 0.9.0
 * http://lab.hakim.se/ladda
 * MIT licensed
 *
 * Copyright (C) 2013 Hakim El Hattab, http://hakim.se
 */
(function(a, b) {
    if (typeof exports === "object") {
        module.exports = b()
    } else {
        if (typeof define === "function" && define.amd) {
            define(["spin"], b)
        } else {
            a.Ladda = b(a.Spinner)
        }
    }
}(this, function(c) {
    var e = [];

    function f(k) {
        if (typeof k === "undefined") {
            console.warn("Ladda button target must be defined.");
            return
        }
        if (!k.querySelector(".ladda-label")) {
            k.innerHTML = '<span class="ladda-label">' + k.innerHTML + "</span>"
        }
        var m = i(k);
        var l = document.createElement("span");
        l.className = "ladda-spinner";
        k.appendChild(l);
        var n;
        var j = {
            start: function() {
                k.setAttribute("disabled", "");
                k.setAttribute("data-loading", "");
                clearTimeout(n);
                m.spin(l);
                this.setProgress(0);
                return this
            },
            startAfter: function(o) {
                clearTimeout(n);
                n = setTimeout(function() {
                    j.start()
                }, o);
                return this
            },
            stop: function() {
                k.removeAttribute("disabled");
                k.removeAttribute("data-loading");
                clearTimeout(n);
                n = setTimeout(function() {
                    m.stop()
                }, 1000);
                return this
            },
            toggle: function() {
                if (this.isLoading()) {
                    this.stop()
                } else {
                    this.start()
                }
                return this
            },
            setProgress: function(o) {
                o = Math.max(Math.min(o, 1), 0);
                var p = k.querySelector(".ladda-progress");
                if (o === 0 && p && p.parentNode) {
                    p.parentNode.removeChild(p)
                } else {
                    if (!p) {
                        p = document.createElement("div");
                        p.className = "ladda-progress";
                        k.appendChild(p)
                    }
                    p.style.width = ((o || 0) * k.offsetWidth) + "px"
                }
            },
            enable: function() {
                this.stop();
                return this
            },
            disable: function() {
                this.stop();
                k.setAttribute("disabled", "");
                return this
            },
            isLoading: function() {
                return k.hasAttribute("data-loading")
            }
        };
        e.push(j);
        return j
    }

    function g(k, j) {
        while (k.parentNode && k.tagName !== j) {
            k = k.parentNode
        }
        return k
    }

    function b(o) {
        var n = ["input", "textarea"];
        var k = [];
        for (var m = 0; m < n.length; m++) {
            var p = o.getElementsByTagName(n[m]);
            for (var l = 0; l < p.length; l++) {
                if (p[l].hasAttribute("required")) {
                    k.push(p[l])
                }
            }
        }
        return k
    }

    function h(n, l) {
        l = l || {};
        var k = [];
        if (typeof n === "string") {
            k = d(document.querySelectorAll(n))
        } else {
            if (typeof n === "object" && typeof n.nodeName === "string") {
                k = [n]
            }
        }
        for (var m = 0, j = k.length; m < j; m++) {
            (function() {
                var p = k[m];
                if (typeof p.addEventListener === "function") {
                    var o = f(p);
                    var q = -1;
                    p.addEventListener("click", function(v) {
                        var u = true;
                        var t = g(p, "FORM");
                        var r = b(t);
                        for (var s = 0; s < r.length; s++) {
                            if (r[s].value.replace(/^\s+|\s+$/g, "") === "") {
                                u = false
                            }
                        }
                        if (u) {
                            o.startAfter(1);
                            if (typeof l.timeout === "number") {
                                clearTimeout(q);
                                q = setTimeout(o.stop, l.timeout)
                            }
                            if (typeof l.callback === "function") {
                                l.callback.apply(null, [o])
                            }
                        }
                    }, false)
                }
            })()
        }
    }

    function a() {
        for (var k = 0, j = e.length; k < j; k++) {
            e[k].stop()
        }
    }

    function i(m) {
        var k = m.offsetHeight,
            p;
        if (k > 32) {
            k *= 0.8
        }
        if (m.hasAttribute("data-spinner-size")) {
            k = parseInt(m.getAttribute("data-spinner-size"), 10)
        }
        if (m.hasAttribute("data-spinner-color")) {
            p = m.getAttribute("data-spinner-color")
        }
        var l = 12,
            j = k * 0.2,
            o = j * 0.6,
            n = j < 7 ? 2 : 3;
        return new c({
            color: p || "#fff",
            lines: l,
            radius: j,
            length: o,
            width: n,
            zIndex: "auto",
            top: "auto",
            left: "auto",
            className: ""
        })
    }

    function d(k) {
        var j = [];
        for (var l = 0; l < k.length; l++) {
            j.push(k[l])
        }
        return j
    }
    return {
        bind: h,
        create: f,
        stopAll: a
    }
}));
/*!
 * jQuery scrollintoview() plugin and :scrollable selector filter
 *
 * Version 1.8 (14 Jul 2011)
 * Requires jQuery 1.4 or newer
 *
 * Copyright (c) 2011 Robert Koritnik
 * Licensed under the terms of the MIT license
 * http://www.opensource.org/licenses/mit-license.php
 */
(function(g) {
    var d = {
        vertical: {
            x: false,
            y: true
        },
        horizontal: {
            x: true,
            y: false
        },
        both: {
            x: true,
            y: true
        },
        x: {
            x: true,
            y: false
        },
        y: {
            x: false,
            y: true
        }
    };
    var c = {
        duration: "fast",
        direction: "both",
        offset: null,
        px_offset: 0
    };
    var f = /^(?:html)$/i;
    var h = function(l, k) {
        k = k || (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(l, null) : l.currentStyle);
        var j = document.defaultView && document.defaultView.getComputedStyle ? true : false;
        var i = {
            top: (parseFloat(j ? k.borderTopWidth : g.css(l, "borderTopWidth")) || 0),
            left: (parseFloat(j ? k.borderLeftWidth : g.css(l, "borderLeftWidth")) || 0),
            bottom: (parseFloat(j ? k.borderBottomWidth : g.css(l, "borderBottomWidth")) || 0),
            right: (parseFloat(j ? k.borderRightWidth : g.css(l, "borderRightWidth")) || 0)
        };
        return {
            top: i.top,
            left: i.left,
            bottom: i.bottom,
            right: i.right,
            vertical: i.top + i.bottom,
            horizontal: i.left + i.right
        }
    };
    var e = function(i) {
        var k = g(window);
        var j = f.test(i[0].nodeName);
        return {
            border: j ? {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            } : h(i[0]),
            scroll: {
                top: (j ? k : i).scrollTop(),
                left: (j ? k : i).scrollLeft()
            },
            scrollbar: {
                right: j ? 0 : i.innerWidth() - i[0].clientWidth,
                bottom: j ? 0 : i.innerHeight() - i[0].clientHeight
            },
            rect: a(i)
        }
    };
    var a = function(i) {
        var j = f.test(i[0].nodeName);
        if (!i.___dimensions_rect) {
            i.___dimensions_rect = {}
        }
        var l = i.___dimensions_rect;
        if (j) {
            l.top = 0, l.left = 0, l.bottom = i[0].clientHeight, l.right = i[0].clientWidth
        } else {
            var k = i[0].getBoundingClientRect();
            l.top = k.top, l.left = k.left, l.bottom = k.bottom, l.right = k.right
        }
        l.height = l.bottom - l.top;
        l.width = l.right - l.left;
        return l
    };
    g.fn.extend({
        dimensions: function() {
            var i = this.eq(0);
            return e(i)
        }
    });
    g.fn.extend({
        dimensions_rect: function() {
            var i = this.eq(0);
            return a(i)
        }
    });
    g.fn.extend({
        scrollintoview: function(q) {
            q = g.extend({}, c, q);
            q.direction = d[typeof(q.direction) === "string" && q.direction.toLowerCase()] || d.both;
            var m = "";
            if (q.direction.x === true) {
                m = "horizontal"
            }
            if (q.direction.y === true) {
                m = m ? "both" : "vertical"
            }
            var i = this.eq(0);
            var l = i.closest(":scrollable(" + m + ")");
            var n = q.px_offset;
            if (l.length > 0) {
                l = l.eq(0);
                var k = {
                    e: e(i),
                    s: e(l)
                };
                var p = {
                    top: k.e.rect.top - (k.s.rect.top + k.s.border.top),
                    bottom: k.s.rect.bottom - k.s.border.bottom - k.s.scrollbar.bottom - k.e.rect.bottom,
                    left: k.e.rect.left - (k.s.rect.left + k.s.border.left),
                    right: k.s.rect.right - k.s.border.right - k.s.scrollbar.right - k.e.rect.right
                };
                var j = {};
                if (q.direction.y === true) {
                    var o = (q.offset == "center" || q.offset == "center_vertical") ? ((k.s.rect.height) - (k.e.rect.height)) / 2 : 0;
                    if (p.top < 0) {
                        if (q.offset == "bottom") {
                            o = k.s.rect.height - k.e.rect.height
                        }
                        j.scrollTop = k.s.scroll.top + p.top - o - n
                    } else {
                        if (p.top > 0 && p.bottom < 0) {
                            if (q.offset == "top") {
                                o = k.s.rect.height - k.e.rect.height
                            }
                            j.scrollTop = k.s.scroll.top + Math.min(p.top, -p.bottom) + o - n
                        }
                    }
                }
                if (q.direction.x === true) {
                    if (p.left < 0) {
                        j.scrollLeft = k.s.scroll.left + p.left
                    } else {
                        if (p.left > 0 && p.right < 0) {
                            j.scrollLeft = k.s.scroll.left + Math.min(p.left, -p.right)
                        }
                    }
                }
                if (!g.isEmptyObject(j)) {
                    if (f.test(l[0].nodeName)) {
                        l = g("html,body")
                    }
                    l.animate(j, q.duration).eq(0).queue(function(r) {
                        g.isFunction(q.complete) && q.complete.call(l[0]);
                        r()
                    })
                } else {
                    g.isFunction(q.complete) && q.complete.call(l[0])
                }
            }
            return this
        }
    });
    var b = {
        auto: true,
        scroll: true,
        visible: false,
        hidden: false
    };
    g.extend(g.expr[":"], {
        scrollable: function(l, j, o, i) {
            var n = d[typeof(o[3]) === "string" && o[3].toLowerCase()] || d.both;
            var m = (document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(l, null) : l.currentStyle);
            var p = {
                x: b[m.overflowX.toLowerCase()] || false,
                y: b[m.overflowY.toLowerCase()] || false,
                isRoot: f.test(l.nodeName)
            };
            if (!p.x && !p.y && !p.isRoot) {
                return false
            }
            var k = {
                height: {
                    scroll: l.scrollHeight,
                    client: l.clientHeight
                },
                width: {
                    scroll: l.scrollWidth,
                    client: l.clientWidth
                },
                scrollableX: function() {
                    return (p.x || p.isRoot) && this.width.scroll > this.width.client
                },
                scrollableY: function() {
                    return (p.y || p.isRoot) && this.height.scroll > this.height.client
                }
            };
            return n.y && k.scrollableY() || n.x && k.scrollableX()
        }
    })
})(jQuery);
/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2012 Rico Sta. Cruz <rico@ricostacruz.com>
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */
(function(k) {
    k.transit = {
        version: "0.9.9",
        propertyMap: {
            marginLeft: "margin",
            marginRight: "margin",
            marginBottom: "margin",
            marginTop: "margin",
            paddingLeft: "padding",
            paddingRight: "padding",
            paddingBottom: "padding",
            paddingTop: "padding"
        },
        enabled: true,
        useTransitionEnd: false
    };
    var d = document.createElement("div");
    var q = {};

    function b(v) {
        if (v in d.style) {
            return v
        }
        var u = ["Moz", "Webkit", "O", "ms"];
        var r = v.charAt(0).toUpperCase() + v.substr(1);
        if (v in d.style) {
            return v
        }
        for (var t = 0; t < u.length;
            ++t) {
            var s = u[t] + r;
            if (s in d.style) {
                return s
            }
        }
    }

    function e() {
        d.style[q.transform] = "";
        d.style[q.transform] = "rotateY(90deg)";
        return d.style[q.transform] !== ""
    }
    var a = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
    q.transition = b("transition");
    q.transitionDelay = b("transitionDelay");
    q.transform = b("transform");
    q.transformOrigin = b("transformOrigin");
    q.transform3d = e();
    var i = {
        transition: "transitionEnd",
        MozTransition: "transitionend",
        OTransition: "oTransitionEnd",
        WebkitTransition: "webkitTransitionEnd",
        msTransition: "MSTransitionEnd"
    };
    var f = q.transitionEnd = i[q.transition] || null;
    for (var p in q) {
        if (q.hasOwnProperty(p) && typeof k.support[p] === "undefined") {
            k.support[p] = q[p]
        }
    }
    d = null;
    k.cssEase = {
        _default: "ease",
        "in": "ease-in",
        out: "ease-out",
        "in-out": "ease-in-out",
        snap: "cubic-bezier(0,1,.5,1)",
        easeOutCubic: "cubic-bezier(.215,.61,.355,1)",
        easeInOutCubic: "cubic-bezier(.645,.045,.355,1)",
        easeInCirc: "cubic-bezier(.6,.04,.98,.335)",
        easeOutCirc: "cubic-bezier(.075,.82,.165,1)",
        easeInOutCirc: "cubic-bezier(.785,.135,.15,.86)",
        easeInExpo: "cubic-bezier(.95,.05,.795,.035)",
        easeOutExpo: "cubic-bezier(.19,1,.22,1)",
        easeInOutExpo: "cubic-bezier(1,0,0,1)",
        easeInQuad: "cubic-bezier(.55,.085,.68,.53)",
        easeOutQuad: "cubic-bezier(.25,.46,.45,.94)",
        easeInOutQuad: "cubic-bezier(.455,.03,.515,.955)",
        easeInQuart: "cubic-bezier(.895,.03,.685,.22)",
        easeOutQuart: "cubic-bezier(.165,.84,.44,1)",
        easeInOutQuart: "cubic-bezier(.77,0,.175,1)",
        easeInQuint: "cubic-bezier(.755,.05,.855,.06)",
        easeOutQuint: "cubic-bezier(.23,1,.32,1)",
        easeInOutQuint: "cubic-bezier(.86,0,.07,1)",
        easeInSine: "cubic-bezier(.47,0,.745,.715)",
        easeOutSine: "cubic-bezier(.39,.575,.565,1)",
        easeInOutSine: "cubic-bezier(.445,.05,.55,.95)",
        easeInBack: "cubic-bezier(.6,-.28,.735,.045)",
        easeOutBack: "cubic-bezier(.175, .885,.32,1.275)",
        easeInOutBack: "cubic-bezier(.68,-.55,.265,1.55)"
    };
    k.cssHooks["transit:transform"] = {
        get: function(r) {
            return k(r).data("transform") || new j()
        },
        set: function(s, r) {
            var t = r;
            if (!(t instanceof j)) {
                t = new j(t)
            }
            if (q.transform === "WebkitTransform" && !a) {
                s.style[q.transform] = t.toString(true)
            } else {
                s.style[q.transform] = t.toString()
            }
            k(s).data("transform", t)
        }
    };
    k.cssHooks.transform = {
        set: k.cssHooks["transit:transform"].set
    };
    if (k.fn.jquery < "1.8") {
        k.cssHooks.transformOrigin = {
            get: function(r) {
                return r.style[q.transformOrigin]
            },
            set: function(r, s) {
                r.style[q.transformOrigin] = s
            }
        };
        k.cssHooks.transition = {
            get: function(r) {
                return r.style[q.transition]
            },
            set: function(r, s) {
                r.style[q.transition] = s
            }
        }
    }
    n("scale");
    n("translate");
    n("rotate");
    n("rotateX");
    n("rotateY");
    n("rotate3d");
    n("perspective");
    n("skewX");
    n("skewY");
    n("x", true);
    n("y", true);

    function j(r) {
        if (typeof r === "string") {
            this.parse(r)
        }
        return this
    }
    j.prototype = {
        setFromString: function(t, s) {
            var r = (typeof s === "string") ? s.split(",") : (s.constructor === Array) ? s : [s];
            r.unshift(t);
            j.prototype.set.apply(this, r)
        },
        set: function(s) {
            var r = Array.prototype.slice.apply(arguments, [1]);
            if (this.setter[s]) {
                this.setter[s].apply(this, r)
            } else {
                this[s] = r.join(",")
            }
        },
        get: function(r) {
            if (this.getter[r]) {
                return this.getter[r].apply(this)
            } else {
                return this[r] || 0
            }
        },
        setter: {
            rotate: function(r) {
                this.rotate = o(r, "deg")
            },
            rotateX: function(r) {
                this.rotateX = o(r, "deg")
            },
            rotateY: function(r) {
                this.rotateY = o(r, "deg")
            },
            scale: function(r, s) {
                if (s === undefined) {
                    s = r
                }
                this.scale = r + "," + s
            },
            skewX: function(r) {
                this.skewX = o(r, "deg")
            },
            skewY: function(r) {
                this.skewY = o(r, "deg")
            },
            perspective: function(r) {
                this.perspective = o(r, "px")
            },
            x: function(r) {
                this.set("translate", r, null)
            },
            y: function(r) {
                this.set("translate", null, r)
            },
            translate: function(r, s) {
                if (this._translateX === undefined) {
                    this._translateX = 0
                }
                if (this._translateY === undefined) {
                    this._translateY = 0
                }
                if (r !== null && r !== undefined) {
                    this._translateX = o(r, "px")
                }
                if (s !== null && s !== undefined) {
                    this._translateY = o(s, "px")
                }
                this.translate = this._translateX + "," + this._translateY
            }
        },
        getter: {
            x: function() {
                return this._translateX || 0
            },
            y: function() {
                return this._translateY || 0
            },
            scale: function() {
                var r = (this.scale || "1,1").split(",");
                if (r[0]) {
                    r[0] = parseFloat(r[0])
                }
                if (r[1]) {
                    r[1] = parseFloat(r[1])
                }
                return (r[0] === r[1]) ? r[0] : r
            },
            rotate3d: function() {
                var t = (this.rotate3d || "0,0,0,0deg").split(",");
                for (var r = 0; r <= 3;
                    ++r) {
                    if (t[r]) {
                        t[r] = parseFloat(t[r])
                    }
                }
                if (t[3]) {
                    t[3] = o(t[3], "deg")
                }
                return t
            }
        },
        parse: function(s) {
            var r = this;
            s.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function(t, v, u) {
                r.setFromString(v, u)
            })
        },
        toString: function(t) {
            var s = [];
            for (var r in this) {
                if (this.hasOwnProperty(r)) {
                    if ((!q.transform3d) && ((r === "rotateX") || (r === "rotateY") || (r === "perspective") || (r === "transformOrigin"))) {
                        continue
                    }
                    if (r[0] !== "_") {
                        if (t && (r === "scale")) {
                            s.push(r + "3d(" + this[r] + ",1)")
                        } else {
                            if (t && (r === "translate")) {
                                s.push(r + "3d(" + this[r] + ",0)")
                            } else {
                                s.push(r + "(" + this[r] + ")")
                            }
                        }
                    }
                }
            }
            return s.join(" ")
        }
    };

    function m(s, r, t) {
        if (r === true) {
            s.queue(t)
        } else {
            if (r) {
                s.queue(r, t)
            } else {
                t()
            }
        }
    }

    function h(s) {
        var r = [];
        k.each(s, function(t) {
            t = k.camelCase(t);
            t = k.transit.propertyMap[t] || k.cssProps[t] || t;
            t = c(t);
            if (k.inArray(t, r) === -1) {
                r.push(t)
            }
        });
        return r
    }

    function g(s, v, x, r) {
        var t = h(s);
        if (k.cssEase[x]) {
            x = k.cssEase[x]
        }
        var w = "" + l(v) + " " + x;
        if (parseInt(r, 10) > 0) {
            w += " " + l(r)
        }
        var u = [];
        k.each(t, function(z, y) {
            u.push(y + " " + w)
        });
        return u.join(", ")
    }
    k.fn.transition = k.fn.transit = function(A, t, z, D) {
        var E = this;
        var v = 0;
        var x = true;
        var r = jQuery.extend(true, {}, A);
        if (typeof t === "function") {
            D = t;
            t = undefined
        }
        if (typeof t === "object") {
            z = t.easing;
            v = t.delay || 0;
            x = t.queue || true;
            D = t.complete;
            t = t.duration
        }
        if (typeof z === "function") {
            D = z;
            z = undefined
        }
        if (typeof r.easing !== "undefined") {
            z = r.easing;
            delete r.easing
        }
        if (typeof r.duration !== "undefined") {
            t = r.duration;
            delete r.duration
        }
        if (typeof r.complete !== "undefined") {
            D = r.complete;
            delete r.complete
        }
        if (typeof r.queue !== "undefined") {
            x = r.queue;
            delete r.queue
        }
        if (typeof r.delay !== "undefined") {
            v = r.delay;
            delete r.delay
        }
        if (typeof t === "undefined") {
            t = k.fx.speeds._default
        }
        if (typeof z === "undefined") {
            z = k.cssEase._default
        }
        t = l(t);
        var F = g(r, t, z, v);
        var C = k.transit.enabled && q.transition;
        var u = C ? (parseInt(t, 10) + parseInt(v, 10)) : 0;
        if (u === 0) {
            var B = function(G) {
                E.css(r);
                if (D) {
                    D.apply(E)
                }
                if (G) {
                    G()
                }
            };
            m(E, x, B);
            return E
        }
        var y = {};
        var s = function(I) {
            var H = false;
            var G = function() {
                if (H) {
                    E.unbind(f, G)
                }
                if (u > 0) {
                    E.each(function() {
                        this.style[q.transition] = (y[this] || null)
                    })
                }
                if (typeof D === "function") {
                    D.apply(E)
                }
                if (typeof I === "function") {
                    I()
                }
            };
            if ((u > 0) && (f) && (k.transit.useTransitionEnd)) {
                H = true;
                E.bind(f, G)
            } else {
                window.setTimeout(G, u)
            }
            E.each(function() {
                if (u > 0) {
                    this.style[q.transition] = F
                }
                k(this).css(A)
            })
        };
        var w = function(G) {
            this.offsetWidth;
            s(G)
        };
        m(E, x, w);
        return this
    };

    function n(s, r) {
        if (!r) {
            k.cssNumber[s] = true
        }
        k.transit.propertyMap[s] = q.transform;
        k.cssHooks[s] = {
            get: function(v) {
                var u = k(v).css("transit:transform");
                return u.get(s)
            },
            set: function(v, w) {
                var u = k(v).css("transit:transform");
                u.setFromString(s, w);
                k(v).css({
                    "transit:transform": u
                })
            }
        }
    }

    function c(r) {
        return r.replace(/([A-Z])/g, function(s) {
            return "-" + s.toLowerCase()
        })
    }

    function o(s, r) {
        if ((typeof s === "string") && (!s.match(/^[\-0-9\.]+$/))) {
            return s
        } else {
            return "" + s + r
        }
    }

    function l(s) {
        var r = s;
        if (typeof r === "string" && (!r.match(/^[\-0-9\.]+/))) {
            r = k.fx.speeds[r] || k.fx.speeds._default
        }
        return o(r, "ms")
    }
    k.transit.getTransitionValue = g
})(jQuery);
(function(e) {
    var d = 70;
    var b = 17;
    var a;
    var c = function() {
        if (window.chrome) {
            return b
        }
        var i = e('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"></div>').appendTo("body");
        var h = e('<div style="height:100px;"></div>').appendTo(i);
        var g = h.innerWidth();
        i.css("overflow-y", "auto");
        var f = h.innerWidth();
        i.remove();
        return Math.max(g - f, b)
    };
    e.fn.extend({
        monkeyScroll: function(f) {
            f = f || {};
            return this.each(function(s, I) {
                var i = e(I);
                if (i.data("monkeyScroll")) {
                    return
                }
                i.addClass("monkey_scroller");
                var v = (I.id) ? "monkey_scroll_wrapper_for_" + I.id : "";
                var m = (f.debug) ? "debug" : "";
                var B = i.wrap('<div class="monkey_scroll_hider ' + m + '" />').parent();
                var E = B.wrap('<div id="' + v + '" class="monkey_scroll_wrapper ' + m + '" />').parent();
                var p = E.prepend('<div class="monkey_scroll_bar ' + m + '" />').children(".monkey_scroll_bar");
                var j = p.prepend(['<div class="monkey_scroll_handle ' + m + '">', '	<div class="monkey_scroll_handle_inner ' + m + '"></div>', "</div>"].join("")).children(".monkey_scroll_handle");
                var x = j.find(".monkey_scroll_handle_inner");
                var l = Math.max(p.width(), j.width());
                var H = parseInt(p.css("margin-top"));
                var w = parseInt(p.css("margin-bottom"));
                j.css("left", -((j.width() - p.width()) / 2));
                var n = function() {
                    var K = Math.max(Math.min(d, i[0].clientHeight), i[0].clientHeight - (H + w));
                    return K
                };
                var y = function() {
                    a = a || c();
                    return Math.max(l, a)
                };
                var r = "";
                var G = function(M) {
                    var L = f.bar_colors;
                    var K, O;
                    var N = "";
                    if (!L) {
                        return
                    }
                    for (O in L) {
                        if (L.hasOwnProperty(O)) {
                            if (O <= M && (!K || O > K)) {
                                K = O
                            }
                        }
                    }
                    if (K) {
                        N = L[K]
                    }
                    if (N !== r) {
                        x.css("background", N);
                        r = N
                    }
                };
                var A = function() {
                    var Q = i.data("monkeyScroll");
                    if (!Q) {
                        J();
                        return null
                    }
                    var P = i[0].clientHeight;
                    var N = i[0].scrollHeight;
                    var M = i[0].scrollTop;
                    var K = i.width();
                    var R = N - P;
                    var O = (R) ? M / R : 1;
                    var L = P / N;
                    Q.state_ob.st = M;
                    Q.state_ob.sh = N;
                    Q.state_ob.ch = P;
                    Q.state_ob.w = K;
                    Q.state_ob.ratio = O;
                    Q.state_ob.perc_visible = L;
                    return Q.state_ob
                };
                var F = function() {
                    var N = A(i);
                    if (!N) {
                        return
                    }
                    var M = N.perc_visible < 1;
                    B.css("margin-right", M ? y() : "");
                    if (!M) {
                        if (i.css("overflow-y") != "scroll") {
                            B.css("width", "100%")
                        }
                        p.hide();
                        return
                    }
                    p.show();
                    var L = n();
                    p.css("height", L);
                    j.css("height", Math.max(d, L * N.perc_visible));
                    var K = L - j.height();
                    j.css("top", K * N.ratio);
                    if (TS.boot_data.feature_darken_scroll_handle) {
                        G(N.ratio)
                    }
                };
                var t = function() {
                    if (i.is(":hidden")) {
                        return
                    }
                    var K = TS.utility.date.getTimeStamp();
                    B.css("width", "");
                    B.css("margin-right", "");
                    i.css("width", "");
                    i.width(i.width());
                    B.width(i.innerWidth() - y());
                    if (f.bar_on_left) {
                        if ("bar_on_left_y" in f) {
                            p.css("margin-left", f.bar_on_left_y)
                        } else {
                            p.css("margin-left", (y() - p.width()) / 2)
                        }
                    } else {
                        p.css("margin-left", B.width() + ((y() - p.width()) / 2))
                    }
                    F();
                    TS.log(389, "update for " + i.attr("id") + " took " + (TS.utility.date.getTimeStamp() - K) + "ms")
                };
                i.data("monkeyScroll", {
                    bar: p,
                    handle: j,
                    state_ob: {},
                    updateFunc: g
                });
                var C = function(K) {
                    F()
                };
                var u = function(P) {
                    P.preventDefault();
                    var L = function(U) {
                        var T = j.height();
                        var S = (U - (T / 2)) / (p.height() - T);
                        var R = i[0].scrollHeight - i[0].clientHeight;
                        return R * S
                    };
                    var M = e(P.target);
                    var Q = P.pageY - M.offset().top;
                    if (M.hasClass("monkey_scroll_bar")) {
                        i.animate({
                            scrollTop: L(Q)
                        }, 200);
                        return
                    }
                    var O = Q;
                    var K = function(R) {
                        var S = R.pageY - p.offset().top + (j.height() / 2) - O;
                        i.scrollTop(L(S))
                    };
                    var N = function() {
                        e("html").unbind("mousemove.monkeyScroll", K);
                        e("html").unbind("mouseup.monkeyScroll", N)
                    };
                    N();
                    e("html").bind("mousemove.monkeyScroll", K);
                    e("html").bind("mouseup.monkeyScroll", N)
                };
                p.bind("mousedown", u);
                i.bind("scroll", C);
                var z = function() {
                    a = null;
                    i.css("width", "");
                    g()
                };
                e(window).bind("resize.monkey", function() {
                    TS.utility.throttle.method(z, "resize_monkey", 150)
                });
                var k;
                var D = function() {
                    if (k) {
                        return
                    }
                    k = true;
                    e("html").bind("mouseup.monkeyScrollOverflowfixer", q)
                };
                var q = function() {
                    B.scrollLeft(0);
                    k = false;
                    e("html").unbind("mouseup.monkeyScrollOverflowfixer", arguments.callee)
                };
                B.bind("scroll", D);
                t();
                var h;

                function g(L) {
                    if (i.is(":hidden")) {
                        return
                    }
                    var K = A();
                    if (!K) {
                        return
                    }
                    if (L || !h || K.sh != h.sh || K.ch != h.ch || K.w != h.w) {
                        t();
                        if (!h) {
                            h = {}
                        }
                        h.st = K.st;
                        h.sh = K.sh;
                        h.ch = K.ch;
                        h.w = K.w;
                        h.ratio = K.ratio;
                        h.perc_visible = K.perc_visible
                    }
                }
                var o;
                if (f.update_on_interval) {
                    o = setInterval(g, 200)
                }
                var J = function() {
                    e(window).unbind("resize.monkey");
                    e("html").unbind("mouseup.monkeyScrollOverflowfixer", q);
                    if (o) {
                        clearInterval(o)
                    }
                }
            })
        }
    })
})(jQuery);
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
                            if (!TS.ui.isElInView(l, -50, m.dimensions_rect())) {
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
                TS.utility.throttle.method(p, "autosize_resize", g.resizeDelay)
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
(function(f) {
    function h(k) {
        var n = k.data("TS-tabComplete");
        var j = n.cmds = [];
        var o = TS.model.input_history;
        var m;
        for (var l = 0; l < o.length; l++) {
            m = o[l];
            if (m.indexOf("/") == 0) {
                j.push(m)
            }
        }
        return j
    }

    function i(n, q, p) {
        if (TS.model.input_history.length == 0) {
            return false
        }
        var l = q.data("TS-tabComplete");
        var j = l.cmds || h(q);
        var r;
        if (l.cmd_matches) {
            r = l.cmd_matches;
            if (p.shiftKey) {
                l.cmd_matches_index--;
                if (l.cmd_matches_index < 0) {
                    l.cmd_matches_index = l.cmd_matches.length - 1
                }
            } else {
                l.cmd_matches_index++;
                if (l.cmd_matches_index >= l.cmd_matches.length) {
                    l.cmd_matches_index = 0
                }
            }
        } else {
            r = [];
            l.cmd_matches_index = 0;
            var k;
            for (var m = 0; m < j.length; m++) {
                k = j[m];
                if (n && k.toLowerCase().indexOf(n.toLowerCase()) != 0) {
                    continue
                }
                r.push(k)
            }
            if (!r.length) {
                return false
            }
            if (r.length > 1) {
                l.cmd_matches = r
            }
        }
        var o = r[l.cmd_matches_index];
        if (l.onComplete) {
            l.onComplete(o)
        }
        q.setCursorPosition(1000000);
        return true
    }

    function b(s, q, y) {
        var B = q.data("TS-tabComplete");
        var k = q.getCursorPosition();
        if (k == 0) {
            return false
        }
        var r = s.substr(0, k);
        var t = r.split(" ");
        var l = t[t.length - 1].toLowerCase();
        var v = "";
        if (!l && !B.channel_matches) {
            return false
        }
        if (l) {
            var p = false;
            if (l.indexOf("#") == 0) {
                p = true
            }
            if (B.channel_prefix) {
                if (l.indexOf(B.channel_prefix + "#") == 0) {
                    p = true
                }
                if (l.indexOf(B.channel_prefix) == 0) {
                    p = true
                }
            }
            if (!p) {
                return false
            }
        }
        var m;
        var n;
        if (!l) {
            m = B.channel_matches;
            if (y.shiftKey) {
                B.channel_matches_index--;
                if (B.channel_matches_index < 0) {
                    B.channel_matches_index = B.channel_matches.length - 1
                }
            } else {
                B.channel_matches_index++;
                if (B.channel_matches_index >= B.channel_matches.length) {
                    B.channel_matches_index = 0
                }
            }
            n = m[B.channel_matches_index];
            var u = t[t.length - 2];
            if (B.channel_prefix && u.toLowerCase().indexOf(B.channel_prefix.toLowerCase()) == 0) {
                v = B.channel_prefix
            }
            t[t.length - 2] = v + "#" + n
        } else {
            m = [];
            var j = TS.channels.getChannelsForUser();
            var C;
            var D;
            var x = l.replace("#", "");
            if (B.channel_prefix && l.toLowerCase().indexOf(B.channel_prefix.toLowerCase()) == 0) {
                x = x.substr(B.channel_prefix.length);
                v = B.channel_prefix
            }
            for (var w = 0; w < j.length; w++) {
                C = j[w];
                if (C.is_archived) {
                    continue
                }
                D = C._name_lc;
                if (D.indexOf(x) == 0 || ("#" + D).indexOf(x) == 0) {
                    m.push(C.name)
                }
            }
            if (!m.length) {
                return false
            }
            g(q, "subsequent name match press");
            B.channel_matches_index = 0;
            if (m.length > 1) {
                B.channel_matches = m
            }
            n = m[B.channel_matches_index];
            t[t.length - 1] = v + "#" + n + " "
        }
        var A = t.join(" ");
        var o = A.length;
        var z = s.replace(r, A);
        if (B.onComplete) {
            B.onComplete(z)
        }
        q.setCursorPosition(o);
        return true
    }

    function c(s, q, A) {
        var E = q.data("TS-tabComplete");
        var l = q.getCursorPosition();
        if (l == 0) {
            return false
        }
        var r = s.substr(0, l);
        var u = r.split(" ");
        var m = u[u.length - 1].toLowerCase();
        var w = "";
        if (!m && !E.member_matches) {
            return false
        }
        var z = "";
        var t = "";
        var n;
        var o;
        if (!m) {
            n = E.member_matches;
            if (A.shiftKey) {
                E.member_matches_index--;
                if (E.member_matches_index < 0) {
                    E.member_matches_index = E.member_matches.length - 1
                }
            } else {
                E.member_matches_index++;
                if (E.member_matches_index >= E.member_matches.length) {
                    E.member_matches_index = 0
                }
            }
            o = n[E.member_matches_index];
            var v = u[u.length - 2];
            if (E.member_prefix && v.toLowerCase().indexOf(E.member_prefix.toLowerCase()) == 0) {
                w = E.member_prefix
            }
            if (u.length - 2 == 0 && E.member_colon) {
                z = ":"
            }
            if (v.indexOf("@") > -1) {
                t = "@"
            }
            u[u.length - 2] = w + t + o + z
        } else {
            n = [];
            var D = [];
            var k = (E.include_self) ? TS.members.getActiveMembersWithSelfAndSlackbot() : TS.members.getActiveMembersWithSlackbotAndNotSelf();
            for (var x = 0; x < k.length; x++) {
                if (k[x].deleted) {
                    continue
                }
                D.push(k[x])
            }
            var j;
            var F;
            var y = m;
            if (E.member_prefix && m.toLowerCase().indexOf(E.member_prefix.toLowerCase()) == 0) {
                y = y.substr(E.member_prefix.length);
                w = E.member_prefix
            }
            for (var x = 0; x < D.length; x++) {
                j = D[x];
                F = j._name_lc;
                if (F.indexOf(y) == 0 || ("@" + F).indexOf(y) == 0) {
                    n.push(j.name)
                }
            }
            if (E.complete_member_specials) {
                if (("@everyone").indexOf(y) == 0) {
                    n.push("everyone")
                }
                if (("@channel").indexOf(y) == 0) {
                    n.push("channel")
                }
                if (("@group").indexOf(y) == 0) {
                    n.push("group")
                }
            }
            if (!n.length) {
                return false
            }
            g(q, "subsequent name match press");
            E.member_matches_index = 0;
            if (n.length > 1) {
                E.member_matches = n
            }
            o = n[E.member_matches_index];
            if (u.length - 1 == 0 && E.member_colon) {
                z = ":"
            }
            if (u[u.length - 1].indexOf("@") > -1) {
                t = "@"
            }
            u[u.length - 1] = w + t + o + z + " "
        }
        var C = u.join(" ");
        var p = C.length;
        var B = s.replace(r, C);
        if (E.onComplete) {
            E.onComplete(B)
        }
        q.setCursorPosition(p);
        return true
    }

    function a(s, q, x) {
        var A = q.data("TS-tabComplete");
        var l = q.getCursorPosition();
        if (l == 0) {
            return false
        }
        var r = s.substr(0, l);
        var t = r.split(" ");
        var m = t[t.length - 1].toLowerCase();
        if (!m && !A.emoji_matches) {
            return false
        }
        if (m && m.indexOf(":") != 0) {
            return false
        }
        var p;
        var n;
        if (!m) {
            p = A.emoji_matches;
            if (x.shiftKey) {
                A.emoji_matches_index--;
                if (A.emoji_matches_index < 0) {
                    A.emoji_matches_index = A.emoji_matches.length - 1
                }
            } else {
                A.emoji_matches_index++;
                if (A.emoji_matches_index >= A.emoji_matches.length) {
                    A.emoji_matches_index = 0
                }
            }
            n = p[A.emoji_matches_index];
            var u = t[t.length - 2];
            t[t.length - 2] = ":" + n + ":"
        } else {
            p = [];
            var k = (TS.ui) ? TS.ui.emoji_names : [];
            var B;
            var w = m.replace(":", "");
            var j = new RegExp("(^)" + TS.utility.regexpEscape(w, 1000), "i");
            for (var v = 0; v < k.length; v++) {
                B = k[v];
                if (!w || B.match(w)) {
                    p.push(B)
                }
            }
            if (!p.length) {
                return false
            }
            g(q, "subsequent emoji match press");
            A.emoji_matches_index = 0;
            if (p.length > 1) {
                A.emoji_matches = p
            }
            n = p[A.emoji_matches_index];
            t[t.length - 1] = ":" + n + ": "
        }
        var z = t.join(" ");
        var o = z.length;
        var y = s.replace(r, z);
        if (A.onComplete) {
            A.onComplete(y)
        }
        q.setCursorPosition(o);
        return true
    }

    function g(j, k) {
        var l = j.data("TS-tabComplete");
        l.cmds = null;
        l.cmd_matches = null;
        l.cmd_matches_index = -1;
        l.member_matches = null;
        l.member_matches_index = -1;
        l.emoji_matches = null;
        l.emoji_matches_index = -1;
        l.channel_matches = null;
        l.channel_matches_index = -1
    }

    function e(k, m) {
        var l = k.data("TS-tabComplete");
        var j = (k.val());
        if (l.complete_emoji && a(j, k, m)) {} else {
            if (l.complete_channels && b(j, k, m)) {} else {
                if (l.complete_members && c(j, k, m)) {} else {
                    if (l.complete_cmds && (!j || j.indexOf("/") == 0) && i(j, k, m)) {}
                }
            }
        }
    }
    var d = {
        init: function(j) {
            var k = f.extend({
                complete_member_specials: false,
                complete_members: true,
                member_prefix: "",
                member_colon: true,
                complete_cmds: false,
                complete_emoji: false,
                complete_channels: false,
                channel_prefix: "",
                include_self: false
            }, j);
            return this.each(function() {
                var l = f(this);
                if (l.data("TS-tabComplete")) {
                    return
                }
                l.data("TS-tabComplete", {
                    cmds: null,
                    cmd_matches: null,
                    cmd_matches_index: -1,
                    member_matches: null,
                    member_matches_index: -1,
                    complete_member_specials: k.complete_member_specials,
                    complete_members: k.complete_members,
                    member_prefix: k.member_prefix,
                    member_colon: k.member_colon,
                    complete_cmds: k.complete_cmds,
                    complete_emoji: k.complete_emoji,
                    complete_channels: k.complete_channels,
                    channel_prefix: k.channel_prefix,
                    include_self: k.include_self,
                    onComplete: k.onComplete
                });
                l.bind("focus", function(m) {
                    l.TS_tabComplete("resetMatches", "focus")
                })
            })
        },
        resetMatches: function(j) {
            return this.each(function() {
                g(f(this), j)
            })
        },
        onTabKey: function(j) {
            j.preventDefault();
            return this.each(function() {
                e(f(this), j)
            })
        }
    };
    f.fn.TS_tabComplete = function(j) {
        if (d[j]) {
            return d[j].apply(this, Array.prototype.slice.call(arguments, 1))
        } else {
            if (typeof j === "object" || !j) {
                return d.init.apply(this, arguments)
            } else {
                f.error("Method " + j + " does not exist on jQuery.tooltip")
            }
        }
    }
})(jQuery);
(function(i) {
    var n = false;
    var m = "MATCHES_SET";
    var e = "MATCH_CHANGED";

    function h(r, q) {
        if (r > q) {
            return 0
        }
        if (r < 0) {
            return q
        }
        return r
    }

    function l(r) {
        var u = r.data("TS-tabComplete");
        var q = u.cmds = [];
        var v = TS.model.input_history;
        var t;
        for (var s = 0; s < v.length; s++) {
            t = v[s];
            if (t.indexOf("/") == 0) {
                q.push(t)
            }
        }
        return q
    }

    function o(u, x, w) {
        if (TS.model.input_history.length == 0) {
            return false
        }
        var s = x.data("TS-tabComplete");
        var q = s.cmds || l(x);
        var y;
        if (s.cmd_matches) {
            y = s.cmd_matches;
            if (w && w.shiftKey) {
                s.cmd_matches_index--;
                if (s.cmd_matches_index < 0) {
                    s.cmd_matches_index = s.cmd_matches.length - 1
                }
            } else {
                s.cmd_matches_index++;
                if (s.cmd_matches_index >= s.cmd_matches.length) {
                    s.cmd_matches_index = 0
                }
            }
        } else {
            y = [];
            s.cmd_matches_index = 0;
            var r;
            for (var t = 0; t < q.length; t++) {
                r = q[t];
                if (u && r.toLowerCase().indexOf(u.toLowerCase()) != 0) {
                    continue
                }
                y.push(r)
            }
            if (!y.length) {
                return false
            }
            if (y.length > 1) {
                s.cmd_matches = y
            }
        }
        if (!w) {
            return true
        }
        var v = y[s.cmd_matches_index];
        if (s.onComplete) {
            s.onComplete(v)
        }
        x.focus().setCursorPosition(1000000);
        return true
    }

    function g(A, y, I) {
        var N = y.data("TS-tabComplete");
        var t = y.getCursorPosition();
        if (t == 0) {}
        if (A.indexOf("/") != 0) {
            return false
        }
        var x = A.substr(t);
        var L = A.substr(0, t).split("\n");
        var z = L.pop();
        var B = z.split(" ");
        var u = B[B.length - 1].toLowerCase();
        var r = TS.cmd_handlers;
        var C = "";
        if (!u && !N.cmd_matches) {
            return false
        }
        if (B.length > 1 && B[0] in r) {}
        if (u && u.indexOf("/") != 0) {
            return false
        }
        var q;
        var v;
        if (I && I.chosen_index != undefined) {
            q = N.cmd_matches;
            N.cmd_matches_index = h(I.chosen_index, N.cmd_matches.length - 1);
            v = q[N.cmd_matches_index]
        } else {
            if (C) {
                TS.dir(0, I);
                N.matched_on = C;
                N.cmd_matches_index = 0;
                N.cmd_matches = [C];
                return m
            } else {
                if (!u) {
                    q = N.cmd_matches;
                    if (I && I.shiftKey) {
                        N.cmd_matches_index--;
                        if (N.cmd_matches_index < 0) {
                            N.cmd_matches_index = N.cmd_matches.length - 1
                        }
                    } else {
                        N.cmd_matches_index++;
                        if (N.cmd_matches_index >= N.cmd_matches.length) {
                            N.cmd_matches_index = 0
                        }
                    }
                    v = q[N.cmd_matches_index]
                } else {
                    q = [];
                    var E;
                    var H = u;
                    var s = new RegExp(TS.utility.regexpEscape(H, 1000), "i");
                    var D = TS.shared.getActiveModelOb();
                    for (var F in r) {
                        E = r[F];
                        if (E.autocomplete === false || E.alias_of) {
                            continue
                        }
                        if (F == "/archive" || F == "/unarchive") {
                            if (TS.model.active_group_id && TS.model.user.is_restricted) {
                                continue
                            }
                            if (TS.model.active_channel_id && !TS.members.canUserArchiveChannels()) {
                                continue
                            }
                            if (TS.model.active_im_id) {
                                continue
                            }
                        } else {
                            if (F == "/kick" || F == "/remove") {
                                if (D.is_archived) {
                                    continue
                                }
                                if (TS.model.active_group_id && !TS.members.canUserKickFromGroups()) {
                                    continue
                                }
                                if (TS.model.active_channel_id && !TS.members.canUserKickFromChannels()) {
                                    continue
                                }
                                if (TS.model.active_im_id) {
                                    continue
                                }
                            } else {
                                if (F == "/join") {
                                    if (TS.model.user.is_restricted) {
                                        continue
                                    }
                                } else {
                                    if (F == "/feed") {
                                        if (TS.model.user.is_restricted) {
                                            continue
                                        }
                                    } else {
                                        if (F == "/invite") {
                                            if (TS.model.user.is_ultra_restricted) {
                                                continue
                                            }
                                        } else {
                                            if (F == "/topic" || F == "/purpose") {
                                                if (TS.model.active_im_id) {
                                                    continue
                                                }
                                                if (TS.model.user.is_restricted) {
                                                    continue
                                                }
                                                if (D.is_general && !TS.members.canUserPostInGeneral()) {
                                                    continue
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (TS.model.user.is_restricted && (E.type == "custom" || E.type == "service")) {
                            if (TS.model.user.is_ultra_restricted) {
                                continue
                            }
                            if (TS.model.team.prefs.commands_only_regular) {
                                continue
                            }
                        }
                        name = F;
                        if (!H || name.match(s)) {
                            q.push(name)
                        } else {
                            if (E.aliases) {
                                for (var G = 0; G < E.aliases.length; G++) {
                                    if (E.aliases[G].match(s)) {
                                        q.push(name);
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (!q.length) {
                        return false
                    }
                    q.sort(function M(P, O) {
                        var Q = P.toLowerCase();
                        var R = O.toLowerCase();
                        if (Q < R) {
                            return -1
                        }
                        if (Q > R) {
                            return 1
                        }
                        return 0
                    });
                    N.cmd_matches_index = 0;
                    if (q.length > 0) {
                        N.cmd_matches = q
                    }
                    v = q[N.cmd_matches_index]
                }
            }
        }
        N.matched_on = u;
        if (!u) {
            B[B.length - 2] = v
        } else {
            B[B.length - 1] = v + " "
        }
        if (!I) {
            return m
        }
        var K = B.join(" ");
        var w = K.length;
        var J = A.replace(z, K);
        if (L.length) {
            w += L.join("\n").length + 1;
            J = L.join("\n") + "\n" + K + x
        }
        if (N.onComplete) {
            N.onComplete(J)
        }
        y.focus().setCursorPosition(w);
        N.selected_index = N.cmd_matches_index;
        return e
    }

    function b(A, y, G) {
        var K = y.data("TS-tabComplete");
        var r = y.getCursorPosition();
        if (r == 0) {
            return false
        }
        var x = A.substr(r);
        var J = A.substr(0, r).split("\n");
        var z = J.pop();
        var B = z.split(" ");
        var s = B[B.length - 1].toLowerCase();
        var D = "";
        if (!s && !K.channel_matches) {
            return false
        }
        if (s) {
            var w = false;
            if (s.indexOf("#") == 0) {
                w = true
            }
            if (K.channel_prefix) {
                if (s.indexOf(K.channel_prefix + "#") == 0) {
                    w = true
                }
                if (s.indexOf(K.channel_prefix) == 0) {
                    w = true
                }
            }
            if (!w) {
                return false
            }
        }
        var t;
        var u;
        if (G && G.chosen_index != undefined) {
            t = K.channel_matches;
            K.channel_matches_index = h(G.chosen_index, K.channel_matches.length - 1);
            u = t[K.channel_matches_index]
        } else {
            if (!s) {
                t = K.channel_matches;
                if (G && G.shiftKey) {
                    K.channel_matches_index--;
                    if (K.channel_matches_index < 0) {
                        K.channel_matches_index = K.channel_matches.length - 1
                    }
                } else {
                    K.channel_matches_index++;
                    if (K.channel_matches_index >= K.channel_matches.length) {
                        K.channel_matches_index = 0
                    }
                }
                u = t[K.channel_matches_index]
            } else {
                t = [];
                var q = TS.channels.getChannelsForUser();
                var L;
                var M;
                var F = s.replace("#", "");
                if (K.channel_prefix && s.toLowerCase().indexOf(K.channel_prefix.toLowerCase()) == 0) {
                    F = F.substr(K.channel_prefix.length);
                    D = K.channel_prefix
                }
                for (var E = 0; E < q.length; E++) {
                    L = q[E];
                    if (L.is_archived) {
                        continue
                    }
                    M = L._name_lc;
                    if (M.indexOf(F) == 0 || ("#" + M).indexOf(F) == 0) {
                        t.push(L.name)
                    }
                }
                if (!t.length) {
                    return false
                }
                K.channel_matches_index = 0;
                if (t.length > 0) {
                    K.channel_matches = t
                }
                u = t[K.channel_matches_index]
            }
        }
        K.matched_on = s;
        if (!s) {
            var C = B[B.length - 2];
            if (K.channel_prefix && C.toLowerCase().indexOf(K.channel_prefix.toLowerCase()) == 0) {
                D = K.channel_prefix
            }
            B[B.length - 2] = D + "#" + u
        } else {
            B[B.length - 1] = D + "#" + u + " "
        }
        if (!G) {
            return m
        }
        var I = B.join(" ");
        var v = I.length;
        var H = A.replace(z, I);
        if (J.length) {
            v += J.join("\n").length + 1;
            H = J.join("\n") + "\n" + I + x
        }
        if (K.onComplete) {
            K.onComplete(H)
        }
        y.focus().setCursorPosition(v);
        K.selected_index = K.channel_matches_index;
        return e
    }

    function d(C, t, ae) {
        var af = t.data("TS-tabComplete");
        var N = t.getCursorPosition();
        if (N == 0) {
            return false
        }
        var E = C.substr(N);
        var ab = C.substr(0, N).split("\n");
        var V = ab.pop();
        var z = V.split(" ");
        var J = z[z.length - 1].toLowerCase();
        var X = "";
        if (!J && !af.member_matches) {
            return false
        }
        var R = "";
        var w = "";
        var L;
        var y;
        if (ae && ae.chosen_index != undefined) {
            L = af.member_matches;
            af.member_matches_index = h(ae.chosen_index, af.member_matches.length - 1);
            y = L[af.member_matches_index]
        } else {
            if (!J) {
                L = af.member_matches;
                if (ae && ae.shiftKey) {
                    af.member_matches_index--;
                    if (af.member_matches_index < 0) {
                        af.member_matches_index = af.member_matches.length - 1
                    }
                } else {
                    af.member_matches_index++;
                    if (af.member_matches_index >= af.member_matches.length) {
                        af.member_matches_index = 0
                    }
                }
                y = L[af.member_matches_index]
            } else {
                L = [];
                var D = [];
                var u = [];
                var Y = [];
                var Q = [];
                var U = [];
                var ad = (af.include_self) ? TS.members.getActiveMembersWithSelfAndSlackbot() : TS.members.getActiveMembersWithSlackbotAndNotSelf();
                for (var ac = 0; ac < ad.length; ac++) {
                    if (ad[ac].deleted) {
                        continue
                    }
                    U.push(ad[ac])
                }
                var aa;
                var H;
                var O;
                var K;
                var P;
                var F;
                var r;
                var G;
                var W;
                var T;
                var s = J;
                var Z = TS.shared.getActiveModelOb();
                if (af.member_prefix && J.toLowerCase().indexOf(af.member_prefix.toLowerCase()) == 0) {
                    s = s.substr(af.member_prefix.length);
                    X = af.member_prefix
                }
                var x = new RegExp("\\b" + TS.utility.regexpEscape(s.replace(/^@/, ""), 1000), "i");
                for (var ac = 0; ac < U.length; ac++) {
                    aa = U[ac];
                    H = aa._name_lc;
                    O = H + ":";
                    K = "@" + H;
                    P = "@" + H + ":";
                    F = (aa.profile.first_name) ? aa._first_nam_lc : "";
                    r = (aa.profile.last_name) ? aa._last_name_lc : "";
                    G = "@" + F;
                    W = "@" + r;
                    T = (aa.profile.real_name_normalized) ? aa.profile.real_name_normalized : "";
                    if (H.indexOf(s) == 0) {
                        D.push(aa)
                    } else {
                        if (O.indexOf(s) == 0) {
                            D.push(aa)
                        } else {
                            if (K.indexOf(s) == 0) {
                                D.push(aa)
                            } else {
                                if (P.indexOf(s) == 0) {
                                    D.push(aa)
                                } else {
                                    if (F && F.indexOf(s) == 0) {
                                        u.push(aa)
                                    } else {
                                        if (r && r.indexOf(s) == 0) {
                                            Y.push(aa)
                                        } else {
                                            if (F && G.indexOf(s) == 0) {
                                                u.push(aa)
                                            } else {
                                                if (r && W.indexOf(s) == 0) {
                                                    Y.push(aa)
                                                } else {
                                                    if (T && x.test(T)) {
                                                        Q.push(aa)
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
                D.sort(function B(ah, A) {
                    var ai = ah._name_lc;
                    var aj = A._name_lc;
                    if (ai < aj) {
                        return -1
                    }
                    if (ai > aj) {
                        return 1
                    }
                    return 0
                });
                u.sort(function B(ah, A) {
                    var ai = ah._first_nam_lc;
                    var aj = A._first_nam_lc;
                    if (ai < aj) {
                        return -1
                    }
                    if (ai > aj) {
                        return 1
                    }
                    return 0
                });
                Y.sort(function B(ah, A) {
                    var ai = ah._last_name_lc;
                    var aj = A._last_name_lc;
                    if (ai < aj) {
                        return -1
                    }
                    if (ai > aj) {
                        return 1
                    }
                    return 0
                });
                Q.sort(function B(ah, A) {
                    var ai = ah._real_name_normalized_lc;
                    var aj = A._real_name_normalized_lc;
                    if (ai < aj) {
                        return -1
                    }
                    if (ai > aj) {
                        return 1
                    }
                    return 0
                });
                D = D.concat(u).concat(Y).concat(Q);
                var S = af.sort_by_membership && Z && !Z.is_im;
                if (S) {
                    var I = [];
                    for (var ac = 0; ac < D.length; ac++) {
                        aa = D[ac];
                        I.push({
                            sort_by: (!aa.is_slackbot && Z.members.indexOf(aa.id) == -1 ? 1000000 : 1000) + ac,
                            name: aa.name
                        })
                    }
                    if (af.complete_member_specials) {
                        if (Z && Z.is_general && TS.members.canUserAtEveryone()) {
                            if ("@everyone".indexOf(s) == 0 || "@all".indexOf(s) == 0) {
                                I.push({
                                    sort_by: ("@everyone" == s || "@all" == s) ? 1 : 2000000,
                                    name: "everyone"
                                })
                            }
                        }
                        if (TS.members.canUserAtChannelOrAtGroup() && Z && Z.is_channel && (!Z.is_general || TS.members.canUserAtEveryone())) {
                            if (("@channel").indexOf(s) == 0) {
                                I.push({
                                    sort_by: 500000,
                                    name: "channel"
                                })
                            }
                        } else {
                            if (TS.members.canUserAtChannelOrAtGroup() && Z && Z.is_group) {
                                if (("@group").indexOf(s) == 0) {
                                    I.push({
                                        sort_by: 500000,
                                        name: "group"
                                    })
                                }
                            }
                        }
                    }
                    I.sort(function B(ah, A) {
                        if (ah.sort_by < A.sort_by) {
                            return -1
                        }
                        if (ah.sort_by > A.sort_by) {
                            return 1
                        }
                        return 0
                    });
                    for (var ac = 0; ac < I.length; ac++) {
                        L.push(I[ac].name)
                    }
                } else {
                    for (var ac = 0; ac < D.length; ac++) {
                        aa = D[ac];
                        L.push(aa.name)
                    }
                    if (af.complete_member_specials) {
                        if (Z && Z.is_general && !TS.model.user.is_restricted) {
                            if (("@everyone").indexOf(s) == 0 || ("@all").indexOf(s) == 0) {
                                if ("@everyone" == s || "@all" == s) {
                                    L.unshift("everyone")
                                } else {
                                    L.push("everyone")
                                }
                            }
                        }
                        if (Z && Z.is_channel) {
                            if (("@channel").indexOf(s) == 0) {
                                if ("@channel" == s) {
                                    L.unshift("channel")
                                } else {
                                    L.push("channel")
                                }
                            }
                        } else {
                            if (Z && Z.is_group) {
                                if (("@group").indexOf(s) == 0) {
                                    if ("@group" == s) {
                                        L.unshift("group")
                                    } else {
                                        L.push("group")
                                    }
                                }
                            }
                        }
                    }
                }
                if (!L.length) {
                    return false
                }
                af.member_matches_index = 0;
                if (L.length > 0) {
                    af.member_matches = L
                }
                y = L[af.member_matches_index]
            }
        }
        af.matched_on = J;
        if (!J) {
            var ag = z[z.length - 2];
            if (af.member_prefix && ag.toLowerCase().indexOf(af.member_prefix.toLowerCase()) == 0) {
                X = af.member_prefix
            }
            if (z.length - 2 == 0 && af.member_colon) {
                R = ":"
            }
            if (ag && ag.indexOf("@") > -1) {
                w = "@"
            }
            z[z.length - 2] = X + w + y + R
        } else {
            if (z.length - 1 == 0 && af.member_colon) {
                R = ":"
            }
            if (z[z.length - 1].indexOf("@") > -1) {
                w = "@"
            }
            z[z.length - 1] = X + w + y + R + " "
        }
        if (!ae) {
            return m
        }
        var v = z.join(" ");
        var M = v.length;
        var q = C.replace(V, v);
        if (ab.length) {
            M += ab.join("\n").length + 1;
            q = ab.join("\n") + "\n" + v + E
        }
        if (af.onComplete) {
            af.onComplete(q)
        }
        t.focus().setCursorPosition(M);
        af.selected_index = af.member_matches_index;
        return e
    }

    function a(A, y, E) {
        var I = y.data("TS-tabComplete");
        var s = y.getCursorPosition();
        if (s == 0) {
            return false
        }
        var x = A.substr(s);
        var H = A.substr(0, s).split("\n");
        var z = H.pop();
        var B = z.split(" ");
        var t = B[B.length - 1].toLowerCase();
        if (!t && !I.emoji_matches) {
            return false
        }
        if (t && t.indexOf(":") != 0) {
            return false
        }
        var w;
        var u;
        if (E && E.chosen_index != undefined) {
            w = I.emoji_matches;
            I.emoji_matches_index = h(E.chosen_index, I.emoji_matches.length - 1);
            u = w[I.emoji_matches_index]
        } else {
            if (!t) {
                w = I.emoji_matches;
                if (E && E.shiftKey) {
                    I.emoji_matches_index--;
                    if (I.emoji_matches_index < 0) {
                        I.emoji_matches_index = I.emoji_matches.length - 1
                    }
                } else {
                    I.emoji_matches_index++;
                    if (I.emoji_matches_index >= I.emoji_matches.length) {
                        I.emoji_matches_index = 0
                    }
                }
                u = w[I.emoji_matches_index]
            } else {
                w = [];
                var r = (TS.ui) ? TS.ui.emoji_names : [];
                var J;
                var D = t.replace(/:/g, "");
                var q = new RegExp("(^)" + TS.utility.regexpEscape(D, 1000), "i");
                for (var C = 0; C < r.length; C++) {
                    J = r[C];
                    if (!D || J.match(q)) {
                        w.push(J)
                    }
                }
                if (!w.length) {
                    return false
                }
                I.emoji_matches_index = 0;
                if (w.length > 0) {
                    I.emoji_matches = w
                }
                u = w[I.emoji_matches_index]
            }
        }
        I.matched_on = t;
        if (!t) {
            B[B.length - 2] = ":" + u + ":"
        } else {
            B[B.length - 1] = ":" + u + ": "
        }
        if (!E) {
            return m
        }
        var G = B.join(" ");
        var v = G.length;
        var F = A.replace(z, G);
        if (H.length) {
            v += H.join("\n").length + 1;
            F = H.join("\n") + "\n" + G + x
        }
        if (I.onComplete) {
            I.onComplete(F)
        }
        y.focus().setCursorPosition(v);
        I.selected_index = I.emoji_matches_index;
        return e
    }

    function k(q, r) {
        if (n) {
            TS.warn("reset " + r)
        }
        var s = q.data("TS-tabComplete");
        var t = j(s);
        s.cmds = null;
        s.cmd_matches = null;
        s.cmd_matches_index = -1;
        s.member_matches = null;
        s.member_matches_index = -1;
        s.emoji_matches = null;
        s.emoji_matches_index = -1;
        s.channel_matches = null;
        s.channel_matches_index = -1;
        s.matched_on = "";
        s.work_on_textchange = true;
        s.selected_index = -1;
        s.ui_showing = false;
        if (t) {
            q.trigger("reset", {
                w: t + " " + r
            })
        }
    }

    function j(q) {
        var r = "";
        if (q.cmd_matches) {
            r = "cmds"
        }
        if (q.member_matches) {
            r = "members"
        }
        if (q.emoji_matches) {
            r = "emoji"
        }
        if (q.channel_matches) {
            r = "channels"
        }
        return r
    }

    function p(x, u, q) {
        var s = x.data("TS-tabComplete");
        var t = (x.val());
        var v = j(s);
        var r = 50;
        var w = false;
        var y = {
            hide_ui: false,
            delay_ui: false,
            shown_callback: function() {
                s.ui_showing = true
            }
        };
        s.ui_showing = false;
        if (TS.model.prefs.enter_is_special_in_tbt && TS.utility.isCursorWithinTBTs(x)) {
            y.hide_ui = true
        }
        if (s.complete_emoji) {
            w = a(t, x, u);
            if (n) {
                TS.info("completeOnEmoji:" + w)
            }
            y.current_matches = s.emoji_matches || [];
            y.w = "emoji";
            y.matched_on = s.matched_on;
            if (w == m) {
                if (n) {
                    TS.info("trigger MATCHES_SET matched_on:" + s.matched_on + " emoji_matches: " + s.emoji_matches)
                }
                if (s.matched_on.length < 3) {
                    y.hide_ui = true
                }
                if (!y.hide_ui) {
                    if (TS.model.prefs.tab_ui_return_selects) {
                        s.selected_index = s.emoji_matches_index
                    }
                }
                y.i = s.selected_index;
                x.trigger("matches_set", y);
                return
            } else {
                if (w == e) {
                    if (n) {
                        TS.info("trigger MATCH_CHANGED " + s.emoji_matches_index)
                    }
                    y.i = s.emoji_matches_index;
                    x.trigger("match_changed", y);
                    return
                } else {
                    if (v == "emoji") {
                        k(x, "not acting")
                    } else {}
                }
            }
        }
        if (s.complete_channels) {
            w = b(t, x, u);
            if (n) {
                TS.info("completeOnChannels:" + w)
            }
            y.current_matches = s.channel_matches || [];
            y.w = "channels";
            y.matched_on = s.matched_on;
            if (w == m) {
                if (n) {
                    TS.info("trigger MATCHES_SET matched_on:" + s.matched_on + " channel_matches: " + s.channel_matches)
                }
                if (!s.matched_on) {
                    y.hide_ui = true
                }
                if (y.current_matches.length > r) {
                    y.hide_ui = true
                }
                if (!y.hide_ui) {
                    if (TS.model.prefs.tab_ui_return_selects) {
                        s.selected_index = s.channel_matches_index
                    }
                }
                y.i = s.selected_index;
                x.trigger("matches_set", y);
                return
            } else {
                if (w == e) {
                    if (n) {
                        TS.info("trigger MATCH_CHANGED " + s.channel_matches_index)
                    }
                    y.i = s.channel_matches_index;
                    x.trigger("match_changed", y);
                    return
                } else {
                    if (v == "channels") {
                        k(x, "not acting")
                    } else {}
                }
            }
        }
        if (s.new_cmds && s.complete_cmds) {
            w = g(t, x, u);
            if (n) {
                TS.info("completeOnCommandsNew:" + w)
            }
            y.current_matches = s.cmd_matches || [];
            y.w = "cmds";
            y.matched_on = s.matched_on;
            if (w == m) {
                if (n) {
                    TS.info("trigger MATCHES_SET matched_on:" + s.matched_on + " cmd_matches: " + s.cmd_matches)
                }
                if (s.matched_on.length < 1) {
                    y.hide_ui = true
                }
                if (!y.hide_ui) {
                    if (TS.model.prefs.tab_ui_return_selects) {
                        s.selected_index = s.cmd_matches_index
                    }
                }
                y.i = s.selected_index;
                x.trigger("matches_set", y);
                return
            } else {
                if (w == e) {
                    if (n) {
                        TS.info("trigger MATCH_CHANGED " + s.cmd_matches_index)
                    }
                    y.i = s.cmd_matches_index;
                    x.trigger("match_changed", y);
                    return
                } else {
                    if (v == "cmds") {
                        k(x, "not acting")
                    } else {}
                }
            }
        }
        if (s.complete_members) {
            w = d(t, x, u);
            if (n) {
                TS.info("completeOnMembers:" + w)
            }
            y.current_matches = s.member_matches || [];
            y.w = "members";
            y.matched_on = s.matched_on;
            y.sort_by_membership = s.sort_by_membership;
            if (s.matched_on && s.matched_on.indexOf("@") != 0 && (!u || u.which != TS.utility.keymap.tab)) {
                y.delay_ui = true
            }
            if (w == m) {
                if (n) {
                    TS.info("trigger MATCHES_SET matched_on:" + s.matched_on + " member_matches:" + s.member_matches)
                }
                if (s.matched_on.indexOf("@") != 0 && (s.matched_on.length < 3 || s.member_prefix_required || TS.model.prefs.require_at)) {
                    y.hide_ui = true
                }
                if (y.current_matches.length > r) {
                    y.hide_ui = true
                }
                if (!y.hide_ui) {
                    if (TS.model.prefs.tab_ui_return_selects) {
                        s.selected_index = s.member_matches_index
                    }
                }
                y.i = s.selected_index;
                x.trigger("matches_set", y);
                return
            } else {
                if (w == e) {
                    if (n) {
                        TS.info("trigger MATCH_CHANGED " + s.member_matches_index)
                    }
                    y.i = s.member_matches_index;
                    x.trigger("match_changed", y);
                    return
                } else {
                    if (v == "members") {
                        k(x, "not acting")
                    } else {}
                }
            }
        }
        if (!s.new_cmds && q && s.complete_cmds && (!t || t.indexOf("/") == 0) && o(t, x, u)) {
            return
        }
    }

    function c(q, r, t) {
        if (n) {
            TS.warn("choose calling work with fake e i:" + r)
        }
        var s = q.data("TS-tabComplete");
        s.work_on_textchange = false;
        p(q, {
            chosen_index: r
        });
        s.work_on_textchange = true;
        if (t) {
            return
        }
        setTimeout(function() {
            k(q, "choose " + r)
        }, 1)
    }
    var f = {
        reset: function(q) {
            var r = i(this);
            k(r, "method called: " + q)
        },
        choose: function(q) {
            var r = i(this);
            c(r, q)
        },
        suspend: function() {
            var r = i(this);
            var q = r.data("TS-tabComplete");
            q.suspended = true;
            k(r, "suspended")
        },
        unsuspend: function() {
            var q = i(this).data("TS-tabComplete");
            q.suspended = false
        },
        changeoption: function(s, r) {
            var q = i(this).data("TS-tabComplete");
            q[s] = r
        },
        init: function(q) {
            var r = i.extend({
                complete_member_specials: false,
                complete_members: true,
                member_prefix: "",
                member_colon: true,
                complete_cmds: false,
                complete_emoji: false,
                complete_channels: false,
                channel_prefix: "",
                no_tab_out: false,
                member_prefix_required: false,
                include_self: false,
                sort_by_membership: false,
                new_cmds: false
            }, q);
            return this.each(function() {
                var s = i(this);
                if (s.data("TS-tabComplete")) {
                    return
                }
                if (q.ui_initer) {
                    q.ui_initer(s)
                }
                s.data("TS-tabComplete", {
                    channel_prefix: r.channel_prefix,
                    cmd_matches_index: -1,
                    cmd_matches: null,
                    cmds: null,
                    complete_channels: r.complete_channels,
                    complete_cmds: r.complete_cmds,
                    complete_emoji: r.complete_emoji,
                    complete_member_specials: r.complete_member_specials,
                    complete_members: r.complete_members,
                    member_colon: r.member_colon,
                    member_matches_index: -1,
                    member_matches: null,
                    member_prefix: r.member_prefix,
                    onComplete: r.onComplete,
                    selected_index: -1,
                    work_on_textchange: true,
                    matched_on: "",
                    suspended: q.suspended === true,
                    member_prefix_required: r.member_prefix_required,
                    include_self: r.include_self,
                    sort_by_membership: r.sort_by_membership,
                    new_cmds: r.new_cmds
                });
                s.bind("textchange", function(u) {
                    var t = s.data("TS-tabComplete");
                    if (t.suspended) {
                        return
                    }
                    if (t.work_on_textchange) {
                        if (n) {
                            TS.warn('textchange calling work no e text:"' + i(this).val() + '"')
                        }
                        p(s, null)
                    }
                });
                s.bind("paste", function(u) {
                    var t = s.data("TS-tabComplete");
                    k(s, "paste");
                    t.work_on_textchange = false;
                    var v = setTimeout(function() {
                        t.work_on_textchange = true
                    }, 50);
                    s.bind("textchange.after_paste", function(w) {
                        clearTimeout(v);
                        t.work_on_textchange = true;
                        s.unbind("textchange.after_paste")
                    })
                });
                s.bind("keydown", function(x) {
                    var v = s.data("TS-tabComplete");
                    if (v.suspended) {
                        return
                    }
                    var w = j(v);
                    var t = TS.utility.keymap;
                    if (n) {
                        TS.info("keydown:" + x.which + ' text:"' + i(this).val() + '" current:' + w + " ---------------------------------------------------------------")
                    }
                    if (x.which == t.tab && !(x.metaKey || x.ctrlKey)) {
                        v.work_on_textchange = false;
                        if (n) {
                            TS.warn("keydown calling work WITH e")
                        }
                        p(s, x, true);
                        if (w || r.no_tab_out) {
                            x.preventDefault()
                        }
                    } else {
                        if (x.which == t.space) {
                            if (!v.new_cmds || w != "cmds") {
                                k(s, "space")
                            }
                        }
                    }
                    if (!v.ui_showing) {
                        return
                    }
                    if (x.which == t.down && w) {
                        x.preventDefault();
                        c(s, v.selected_index + 1, true)
                    } else {
                        if (x.which == t.up && w) {
                            x.preventDefault();
                            x.shiftKey = true;
                            c(s, v.selected_index - 1, true)
                        } else {
                            if (x.which == t.right && w == "emoji") {
                                x.preventDefault();
                                c(s, v.selected_index + 1, true)
                            } else {
                                if (x.which == t.left && w == "emoji") {
                                    x.preventDefault();
                                    x.shiftKey = true;
                                    c(s, v.selected_index - 1, true)
                                } else {
                                    if (x.which == t.enter && !TS.model.prefs.tab_ui_return_selects) {
                                        k(s, "enter")
                                    } else {
                                        if (x.which == t.enter && v.selected_index != -1) {
                                            if (v.new_cmds && w == "cmds") {
                                                c(s, v.selected_index)
                                            } else {
                                                c(s, v.selected_index)
                                            }
                                        } else {
                                            if (x.which == t.enter || x.which == t.tab) {
                                                var u;
                                                if (w == "members") {
                                                    u = v.member_matches
                                                }
                                                if (w == "channels") {
                                                    u = v.channel_matches
                                                }
                                                if (w == "emoji") {
                                                    u = v.emoji_matches
                                                }
                                                if (v.new_cmds && w == "cmds") {
                                                    u = v.cmd_matches
                                                }
                                                if (u && u.length == 1) {
                                                    c(s, 0)
                                                }
                                            } else {
                                                if (x.which == t.esc || x.which == t.alt || x.which == t.ctrl || x.which == t.cmd_ff || x.which == t.cmd_other || x.which == t.left || x.which == t.right || x.which == t.end || x.which == t.home) {
                                                    k(s, x.which)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                s.bind("keyup", function(u) {
                    var t = s.data("TS-tabComplete");
                    if (t.suspended) {
                        return
                    }
                    t.work_on_textchange = true
                })
            })
        }
    };
    i.fn.TS_tabComplete2 = function(q) {
        if (f[q]) {
            return f[q].apply(this, Array.prototype.slice.call(arguments, 1))
        } else {
            if (typeof q === "object" || !q) {
                return f.init.apply(this, arguments)
            } else {
                i.error("Method " + q + " does not exist on jQuery.tooltip")
            }
        }
    }
})(jQuery);

function printStackTrace(b) {
    b = b || {
        guess: true
    };
    var c = b.e || null,
        e = !!b.guess;
    var d = new printStackTrace.implementation(),
        a = d.run(c);
    return (e) ? d.guessAnonymousFunctions(a) : a
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = printStackTrace
}
printStackTrace.implementation = function() {};
printStackTrace.implementation.prototype = {
    run: function(a, b) {
        a = a || this.createException();
        b = b || this.mode(a);
        if (b === "other") {
            return this.other(arguments.callee)
        } else {
            return this[b](a)
        }
    },
    createException: function() {
        try {
            this.undef()
        } catch (a) {
            return a
        }
    },
    mode: function(a) {
        if (a["arguments"] && a.stack) {
            return "chrome"
        } else {
            if (a.stack && a.sourceURL) {
                return "safari"
            } else {
                if (a.stack && a.number) {
                    return "ie"
                } else {
                    if (typeof a.message === "string" && typeof window !== "undefined" && window.opera) {
                        if (!a.stacktrace) {
                            return "opera9"
                        }
                        if (a.message.indexOf("\n") > -1 && a.message.split("\n").length > a.stacktrace.split("\n").length) {
                            return "opera9"
                        }
                        if (!a.stack) {
                            return "opera10a"
                        }
                        if (a.stacktrace.indexOf("called from line") < 0) {
                            return "opera10b"
                        }
                        return "opera11"
                    } else {
                        if (a.stack) {
                            return "firefox"
                        }
                    }
                }
            }
        }
        return "other"
    },
    instrumentFunction: function(b, d, e) {
        b = b || window;
        var a = b[d];
        b[d] = function c() {
            e.call(this, printStackTrace().slice(4));
            return b[d]._instrumented.apply(this, arguments)
        };
        b[d]._instrumented = a
    },
    deinstrumentFunction: function(a, b) {
        if (a[b].constructor === Function && a[b]._instrumented && a[b]._instrumented.constructor === Function) {
            a[b] = a[b]._instrumented
        }
    },
    chrome: function(b) {
        var a = (b.stack + "\n").replace(/^\S[^\(]+?[\n$]/gm, "").replace(/^\s+(at eval )?at\s+/gm, "").replace(/^([^\(]+?)([\n$])/gm, "{anonymous}()@$1$2").replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, "{anonymous}()@$1").split("\n");
        a.pop();
        return a
    },
    safari: function(a) {
        return a.stack.replace(/\[native code\]\n/m, "").replace(/^(?=\w+Error\:).*$\n/m, "").replace(/^@/gm, "{anonymous}()@").split("\n")
    },
    ie: function(b) {
        var a = /^.*at (\w+) \(([^\)]+)\)$/gm;
        return b.stack.replace(/at Anonymous function /gm, "{anonymous}()@").replace(/^(?=\w+Error\:).*$\n/m, "").replace(a, "$1@$2").split("\n")
    },
    firefox: function(a) {
        return a.stack.replace(/(?:\n@:0)?\s+$/m, "").replace(/^[\(@]/gm, "{anonymous}()@").split("\n")
    },
    opera11: function(g) {
        var a = "{anonymous}",
            h = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;
        var k = g.stacktrace.split("\n"),
            l = [];
        for (var c = 0, f = k.length; c < f; c += 2) {
            var d = h.exec(k[c]);
            if (d) {
                var j = d[4] + ":" + d[1] + ":" + d[2];
                var b = d[3] || "global code";
                b = b.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, a);
                l.push(b + "@" + j + " -- " + k[c + 1].replace(/^\s+/, ""))
            }
        }
        return l
    },
    opera10b: function(h) {
        var g = /^(.*)@(.+):(\d+)$/;
        var c = h.stacktrace.split("\n"),
            b = [];
        for (var f = 0, a = c.length; f < a; f++) {
            var d = g.exec(c[f]);
            if (d) {
                var j = d[1] ? (d[1] + "()") : "global code";
                b.push(j + "@" + d[2] + ":" + d[3])
            }
        }
        return b
    },
    opera10a: function(g) {
        var a = "{anonymous}",
            h = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var j = g.stacktrace.split("\n"),
            k = [];
        for (var c = 0, f = j.length; c < f; c += 2) {
            var d = h.exec(j[c]);
            if (d) {
                var b = d[3] || a;
                k.push(b + "()@" + d[2] + ":" + d[1] + " -- " + j[c + 1].replace(/^\s+/, ""))
            }
        }
        return k
    },
    opera9: function(j) {
        var d = "{anonymous}",
            h = /Line (\d+).*script (?:in )?(\S+)/i;
        var c = j.message.split("\n"),
            b = [];
        for (var g = 2, a = c.length; g < a; g += 2) {
            var f = h.exec(c[g]);
            if (f) {
                b.push(d + "()@" + f[2] + ":" + f[1] + " -- " + c[g + 1].replace(/^\s+/, ""))
            }
        }
        return b
    },
    other: function(g) {
        var b = "{anonymous}",
            f = /function\s*([\w\-$]+)?\s*\(/i,
            a = [],
            d, c, e = 10;
        while (g && g["arguments"] && a.length < e) {
            d = f.test(g.toString()) ? RegExp.$1 || b : b;
            c = Array.prototype.slice.call(g["arguments"] || []);
            a[a.length] = d + "(" + this.stringifyArguments(c) + ")";
            g = g.caller
        }
        return a
    },
    stringifyArguments: function(c) {
        var b = [];
        var e = Array.prototype.slice;
        for (var d = 0; d < c.length;
            ++d) {
            var a = c[d];
            if (a === undefined) {
                b[d] = "undefined"
            } else {
                if (a === null) {
                    b[d] = "null"
                } else {
                    if (a.constructor) {
                        if (a.constructor === Array) {
                            if (a.length < 3) {
                                b[d] = "[" + this.stringifyArguments(a) + "]"
                            } else {
                                b[d] = "[" + this.stringifyArguments(e.call(a, 0, 1)) + "..." + this.stringifyArguments(e.call(a, -1)) + "]"
                            }
                        } else {
                            if (a.constructor === Object) {
                                b[d] = "#object"
                            } else {
                                if (a.constructor === Function) {
                                    b[d] = "#function"
                                } else {
                                    if (a.constructor === String) {
                                        b[d] = '"' + a + '"'
                                    } else {
                                        if (a.constructor === Number) {
                                            b[d] = a
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return b.join(",")
    },
    sourceCache: {},
    ajax: function(a) {
        var b = this.createXMLHTTPObject();
        if (b) {
            try {
                b.open("GET", a, false);
                b.send(null);
                return b.responseText
            } catch (c) {}
        }
        return ""
    },
    createXMLHTTPObject: function() {
        var c, a = [function() {
            return new XMLHttpRequest()
        }, function() {
            return new ActiveXObject("Msxml2.XMLHTTP")
        }, function() {
            return new ActiveXObject("Msxml3.XMLHTTP")
        }, function() {
            return new ActiveXObject("Microsoft.XMLHTTP")
        }];
        for (var b = 0; b < a.length; b++) {
            try {
                c = a[b]();
                this.createXMLHTTPObject = a[b];
                return c
            } catch (d) {}
        }
    },
    isSameDomain: function(a) {
        return typeof location !== "undefined" && a.indexOf(location.hostname) !== -1
    },
    getSource: function(a) {
        if (!(a in this.sourceCache)) {
            this.sourceCache[a] = this.ajax(a).split("\n")
        }
        return this.sourceCache[a]
    },
    guessAnonymousFunctions: function(k) {
        for (var g = 0; g < k.length;
            ++g) {
            var f = /\{anonymous\}\(.*\)@(.*)/,
                l = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,
                b = k[g],
                c = f.exec(b);
            if (c) {
                var e = l.exec(c[1]);
                if (e) {
                    var d = e[1],
                        a = e[2],
                        j = e[3] || 0;
                    if (d && this.isSameDomain(d) && a) {
                        var h = this.guessAnonymousFunction(d, a, j);
                        k[g] = b.replace("{anonymous}", h)
                    }
                }
            }
        }
        return k
    },
    guessAnonymousFunction: function(c, f, a) {
        var b;
        try {
            b = this.findFunctionName(this.getSource(c), f)
        } catch (d) {
            b = "getSource failed with url: " + c + ", exception: " + d.toString()
        }
        return b
    },
    findFunctionName: function(a, e) {
        var g = /function\s+([^(]*?)\s*\(([^)]*)\)/;
        var k = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
        var h = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
        var b = "",
            l, j = Math.min(e, 20),
            d, c;
        for (var f = 0; f < j;
            ++f) {
            l = a[e - f - 1];
            c = l.indexOf("//");
            if (c >= 0) {
                l = l.substr(0, c)
            }
            if (l) {
                b = l + b;
                d = k.exec(b);
                if (d && d[1]) {
                    return d[1]
                }
                d = g.exec(b);
                if (d && d[1]) {
                    return d[1]
                }
                d = h.exec(b);
                if (d && d[1]) {
                    return d[1]
                }
            }
        }
        return "(?)"
    }
};
(function(b, c) {
    function a(e, l, j) {
        if (e) {
            e = e.replace(/\@/g, "&#64;")
        }
        var d = {},
            g = "",
            v = "...",
            p = ["img", "br"],
            u = [],
            C = 0,
            w = g,
            q = '([\\w|-]+\\s*=\\s*"[^"]*"\\s*)*',
            A = "\\s*\\/?\\s*",
            k = "\\s*\\/\\s*",
            s = new RegExp("<\\/?\\w+\\s*" + q + k + ">"),
            m = new RegExp("<\\/?\\w+\\s*" + q + A + ">"),
            x = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w\-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g,
            r = new RegExp("<img\\s*" + q + A + ">"),
            h = true,
            t, n, o, B, f;

        function i(G) {
            var F = r.exec(G),
                E, D;
            if (!F) {
                return G
            }
            E = F.index;
            D = F[0].length;
            return G.substring(0, E) + G.substring(E + D)
        }

        function y(D) {
            var E = "";
            D.reverse().forEach(function(F, G) {
                if (-1 === p.indexOf(F)) {
                    E += "</" + F + ">"
                }
            });
            return E
        }

        function z(E) {
            var D = E.indexOf(" ");
            if (-1 === D) {
                D = E.indexOf(">");
                if (-1 === D) {
                    throw new Error("HTML tag is not well-formed : " + E)
                }
            }
            return E.substring(1, D)
        }
        j = j || d;
        j.ellipsis = (c !== j.ellipsis) ? j.ellipsis : v;
        while (h) {
            h = m.exec(e);
            if (!h) {
                if (C >= l) {
                    break
                }
                h = x.exec(e);
                if (!h || h.index >= l) {
                    w += e.substring(0, l - C);
                    break
                }
                while (h) {
                    t = h[0];
                    n = h.index;
                    w += e.substring(0, (n + t.length) - C);
                    e = e.substring(n + t.length);
                    h = x.exec(e)
                }
                break
            }
            t = h[0];
            n = h.index;
            if (C + n > l) {
                w += (e.substring(0, l - C));
                break
            } else {
                C += n;
                w += e.substring(0, n)
            }
            if ("/" === t[1]) {
                u.pop()
            } else {
                f = s.exec(t);
                if (!f) {
                    B = z(t);
                    u.push(B)
                }
            }
            if (f) {
                w += f[0]
            } else {
                w += t
            }
            e = e.substring(n + t.length)
        }
        if (e.length > l && j.ellipsis) {
            w += j.ellipsis
        }
        w += y(u);
        if (!j.keepImageTag) {
            w = i(w)
        }
        return w
    }
    if ("undefined" !== typeof module && module.exports) {
        module.exports = a
    } else {
        b.truncate = a
    }
}(this));
var swfobject = function() {
    var aq = "undefined",
        aD = "object",
        ab = "Shockwave Flash",
        X = "ShockwaveFlash.ShockwaveFlash",
        aE = "application/x-shockwave-flash",
        ac = "SWFObjectExprInst",
        ax = "onreadystatechange",
        af = window,
        aL = document,
        aB = navigator,
        aa = false,
        Z = [aN],
        aG = [],
        ag = [],
        al = [],
        aJ, ad, ap, at, ak = false,
        aU = false,
        aH, an, aI = true,
        ah = function() {
            var a = typeof aL.getElementById != aq && typeof aL.getElementsByTagName != aq && typeof aL.createElement != aq,
                e = aB.userAgent.toLowerCase(),
                c = aB.platform.toLowerCase(),
                h = c ? /win/.test(c) : /win/.test(e),
                j = c ? /mac/.test(c) : /mac/.test(e),
                g = /webkit/.test(e) ? parseFloat(e.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false,
                d = !+"\v1",
                f = [0, 0, 0],
                k = null;
            if (typeof aB.plugins != aq && typeof aB.plugins[ab] == aD) {
                k = aB.plugins[ab].description;
                if (k && !(typeof aB.mimeTypes != aq && aB.mimeTypes[aE] && !aB.mimeTypes[aE].enabledPlugin)) {
                    aa = true;
                    d = false;
                    k = k.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                    f[0] = parseInt(k.replace(/^(.*)\..*$/, "$1"), 10);
                    f[1] = parseInt(k.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                    f[2] = /[a-zA-Z]/.test(k) ? parseInt(k.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0
                }
            } else {
                if (typeof af.ActiveXObject != aq) {
                    try {
                        var i = new ActiveXObject(X);
                        if (i) {
                            k = i.GetVariable("$version");
                            if (k) {
                                d = true;
                                k = k.split(" ")[1].split(",");
                                f = [parseInt(k[0], 10), parseInt(k[1], 10), parseInt(k[2], 10)]
                            }
                        }
                    } catch (b) {}
                }
            }
            return {
                w3: a,
                pv: f,
                wk: g,
                ie: d,
                win: h,
                mac: j
            }
        }(),
        aK = function() {
            if (!ah.w3) {
                return
            }
            if ((typeof aL.readyState != aq && aL.readyState == "complete") || (typeof aL.readyState == aq && (aL.getElementsByTagName("body")[0] || aL.body))) {
                aP()
            }
            if (!ak) {
                if (typeof aL.addEventListener != aq) {
                    aL.addEventListener("DOMContentLoaded", aP, false)
                }
                if (ah.ie && ah.win) {
                    aL.attachEvent(ax, function() {
                        if (aL.readyState == "complete") {
                            aL.detachEvent(ax, arguments.callee);
                            aP()
                        }
                    });
                    if (af == top) {
                        (function() {
                            if (ak) {
                                return
                            }
                            try {
                                aL.documentElement.doScroll("left")
                            } catch (a) {
                                setTimeout(arguments.callee, 0);
                                return
                            }
                            aP()
                        })()
                    }
                }
                if (ah.wk) {
                    (function() {
                        if (ak) {
                            return
                        }
                        if (!/loaded|complete/.test(aL.readyState)) {
                            setTimeout(arguments.callee, 0);
                            return
                        }
                        aP()
                    })()
                }
                aC(aP)
            }
        }();

    function aP() {
        if (ak) {
            return
        }
        try {
            var b = aL.getElementsByTagName("body")[0].appendChild(ar("span"));
            b.parentNode.removeChild(b)
        } catch (a) {
            return
        }
        ak = true;
        var d = Z.length;
        for (var c = 0; c < d; c++) {
            Z[c]()
        }
    }

    function aj(a) {
        if (ak) {
            a()
        } else {
            Z[Z.length] = a
        }
    }

    function aC(a) {
        if (typeof af.addEventListener != aq) {
            af.addEventListener("load", a, false)
        } else {
            if (typeof aL.addEventListener != aq) {
                aL.addEventListener("load", a, false)
            } else {
                if (typeof af.attachEvent != aq) {
                    aM(af, "onload", a)
                } else {
                    if (typeof af.onload == "function") {
                        var b = af.onload;
                        af.onload = function() {
                            b();
                            a()
                        }
                    } else {
                        af.onload = a
                    }
                }
            }
        }
    }

    function aN() {
        if (aa) {
            Y()
        } else {
            am()
        }
    }

    function Y() {
        var d = aL.getElementsByTagName("body")[0];
        var b = ar(aD);
        b.setAttribute("type", aE);
        var a = d.appendChild(b);
        if (a) {
            var c = 0;
            (function() {
                if (typeof a.GetVariable != aq) {
                    var e = a.GetVariable("$version");
                    if (e) {
                        e = e.split(" ")[1].split(",");
                        ah.pv = [parseInt(e[0], 10), parseInt(e[1], 10), parseInt(e[2], 10)]
                    }
                } else {
                    if (c < 10) {
                        c++;
                        setTimeout(arguments.callee, 10);
                        return
                    }
                }
                d.removeChild(b);
                a = null;
                am()
            })()
        } else {
            am()
        }
    }

    function am() {
        var g = aG.length;
        if (g > 0) {
            for (var h = 0; h < g; h++) {
                var c = aG[h].id;
                var l = aG[h].callbackFn;
                var a = {
                    success: false,
                    id: c
                };
                if (ah.pv[0] > 0) {
                    var i = aS(c);
                    if (i) {
                        if (ao(aG[h].swfVersion) && !(ah.wk && ah.wk < 312)) {
                            ay(c, true);
                            if (l) {
                                a.success = true;
                                a.ref = av(c);
                                l(a)
                            }
                        } else {
                            if (aG[h].expressInstall && au()) {
                                var e = {};
                                e.data = aG[h].expressInstall;
                                e.width = i.getAttribute("width") || "0";
                                e.height = i.getAttribute("height") || "0";
                                if (i.getAttribute("class")) {
                                    e.styleclass = i.getAttribute("class")
                                }
                                if (i.getAttribute("align")) {
                                    e.align = i.getAttribute("align")
                                }
                                var f = {};
                                var d = i.getElementsByTagName("param");
                                var k = d.length;
                                for (var j = 0; j < k; j++) {
                                    if (d[j].getAttribute("name").toLowerCase() != "movie") {
                                        f[d[j].getAttribute("name")] = d[j].getAttribute("value")
                                    }
                                }
                                ae(e, f, c, l)
                            } else {
                                aF(i);
                                if (l) {
                                    l(a)
                                }
                            }
                        }
                    }
                } else {
                    ay(c, true);
                    if (l) {
                        var b = av(c);
                        if (b && typeof b.SetVariable != aq) {
                            a.success = true;
                            a.ref = b
                        }
                        l(a)
                    }
                }
            }
        }
    }

    function av(b) {
        var d = null;
        var c = aS(b);
        if (c && c.nodeName == "OBJECT") {
            if (typeof c.SetVariable != aq) {
                d = c
            } else {
                var a = c.getElementsByTagName(aD)[0];
                if (a) {
                    d = a
                }
            }
        }
        return d
    }

    function au() {
        return !aU && ao("6.0.65") && (ah.win || ah.mac) && !(ah.wk && ah.wk < 312)
    }

    function ae(f, d, h, e) {
        aU = true;
        ap = e || null;
        at = {
            success: false,
            id: h
        };
        var a = aS(h);
        if (a) {
            if (a.nodeName == "OBJECT") {
                aJ = aO(a);
                ad = null
            } else {
                aJ = a;
                ad = h
            }
            f.id = ac;
            if (typeof f.width == aq || (!/%$/.test(f.width) && parseInt(f.width, 10) < 310)) {
                f.width = "310"
            }
            if (typeof f.height == aq || (!/%$/.test(f.height) && parseInt(f.height, 10) < 137)) {
                f.height = "137"
            }
            aL.title = aL.title.slice(0, 47) + " - Flash Player Installation";
            var b = ah.ie && ah.win ? "ActiveX" : "PlugIn",
                c = "MMredirectURL=" + af.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + b + "&MMdoctitle=" + aL.title;
            if (typeof d.flashvars != aq) {
                d.flashvars += "&" + c
            } else {
                d.flashvars = c
            }
            if (ah.ie && ah.win && a.readyState != 4) {
                var g = ar("div");
                h += "SWFObjectNew";
                g.setAttribute("id", h);
                a.parentNode.insertBefore(g, a);
                a.style.display = "none";
                (function() {
                    if (a.readyState == 4) {
                        a.parentNode.removeChild(a)
                    } else {
                        setTimeout(arguments.callee, 10)
                    }
                })()
            }
            aA(f, d, h)
        }
    }

    function aF(a) {
        if (ah.ie && ah.win && a.readyState != 4) {
            var b = ar("div");
            a.parentNode.insertBefore(b, a);
            b.parentNode.replaceChild(aO(a), b);
            a.style.display = "none";
            (function() {
                if (a.readyState == 4) {
                    a.parentNode.removeChild(a)
                } else {
                    setTimeout(arguments.callee, 10)
                }
            })()
        } else {
            a.parentNode.replaceChild(aO(a), a)
        }
    }

    function aO(b) {
        var d = ar("div");
        if (ah.win && ah.ie) {
            d.innerHTML = b.innerHTML
        } else {
            var e = b.getElementsByTagName(aD)[0];
            if (e) {
                var a = e.childNodes;
                if (a) {
                    var f = a.length;
                    for (var c = 0; c < f; c++) {
                        if (!(a[c].nodeType == 1 && a[c].nodeName == "PARAM") && !(a[c].nodeType == 8)) {
                            d.appendChild(a[c].cloneNode(true))
                        }
                    }
                }
            }
        }
        return d
    }

    function aA(e, g, c) {
        var d, a = aS(c);
        if (ah.wk && ah.wk < 312) {
            return d
        }
        if (a) {
            if (typeof e.id == aq) {
                e.id = c
            }
            if (ah.ie && ah.win) {
                var f = "";
                for (var i in e) {
                    if (e[i] != Object.prototype[i]) {
                        if (i.toLowerCase() == "data") {
                            g.movie = e[i]
                        } else {
                            if (i.toLowerCase() == "styleclass") {
                                f += ' class="' + e[i] + '"'
                            } else {
                                if (i.toLowerCase() != "classid") {
                                    f += " " + i + '="' + e[i] + '"'
                                }
                            }
                        }
                    }
                }
                var h = "";
                for (var j in g) {
                    if (g[j] != Object.prototype[j]) {
                        h += '<param name="' + j + '" value="' + g[j] + '" />'
                    }
                }
                a.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + f + ">" + h + "</object>";
                ag[ag.length] = e.id;
                d = aS(e.id)
            } else {
                var b = ar(aD);
                b.setAttribute("type", aE);
                for (var k in e) {
                    if (e[k] != Object.prototype[k]) {
                        if (k.toLowerCase() == "styleclass") {
                            b.setAttribute("class", e[k])
                        } else {
                            if (k.toLowerCase() != "classid") {
                                b.setAttribute(k, e[k])
                            }
                        }
                    }
                }
                for (var l in g) {
                    if (g[l] != Object.prototype[l] && l.toLowerCase() != "movie") {
                        aQ(b, l, g[l])
                    }
                }
                a.parentNode.replaceChild(b, a);
                d = b
            }
        }
        return d
    }

    function aQ(b, d, c) {
        var a = ar("param");
        a.setAttribute("name", d);
        a.setAttribute("value", c);
        b.appendChild(a)
    }

    function aw(a) {
        var b = aS(a);
        if (b && b.nodeName == "OBJECT") {
            if (ah.ie && ah.win) {
                b.style.display = "none";
                (function() {
                    if (b.readyState == 4) {
                        aT(a)
                    } else {
                        setTimeout(arguments.callee, 10)
                    }
                })()
            } else {
                b.parentNode.removeChild(b)
            }
        }
    }

    function aT(a) {
        var b = aS(a);
        if (b) {
            for (var c in b) {
                if (typeof b[c] == "function") {
                    b[c] = null
                }
            }
            b.parentNode.removeChild(b)
        }
    }

    function aS(a) {
        var c = null;
        try {
            c = aL.getElementById(a)
        } catch (b) {}
        return c
    }

    function ar(a) {
        return aL.createElement(a)
    }

    function aM(a, c, b) {
        a.attachEvent(c, b);
        al[al.length] = [a, c, b]
    }

    function ao(a) {
        var b = ah.pv,
            c = a.split(".");
        c[0] = parseInt(c[0], 10);
        c[1] = parseInt(c[1], 10) || 0;
        c[2] = parseInt(c[2], 10) || 0;
        return (b[0] > c[0] || (b[0] == c[0] && b[1] > c[1]) || (b[0] == c[0] && b[1] == c[1] && b[2] >= c[2])) ? true : false
    }

    function az(b, f, a, c) {
        if (ah.ie && ah.mac) {
            return
        }
        var e = aL.getElementsByTagName("head")[0];
        if (!e) {
            return
        }
        var g = (a && typeof a == "string") ? a : "screen";
        if (c) {
            aH = null;
            an = null
        }
        if (!aH || an != g) {
            var d = ar("style");
            d.setAttribute("type", "text/css");
            d.setAttribute("media", g);
            aH = e.appendChild(d);
            if (ah.ie && ah.win && typeof aL.styleSheets != aq && aL.styleSheets.length > 0) {
                aH = aL.styleSheets[aL.styleSheets.length - 1]
            }
            an = g
        }
        if (ah.ie && ah.win) {
            if (aH && typeof aH.addRule == aD) {
                aH.addRule(b, f)
            }
        } else {
            if (aH && typeof aL.createTextNode != aq) {
                aH.appendChild(aL.createTextNode(b + " {" + f + "}"))
            }
        }
    }

    function ay(a, c) {
        if (!aI) {
            return
        }
        var b = c ? "visible" : "hidden";
        if (ak && aS(a)) {
            aS(a).style.visibility = b
        } else {
            az("#" + a, "visibility:" + b)
        }
    }

    function ai(b) {
        var a = /[\\\"<>\.;]/;
        var c = a.exec(b) != null;
        return c && typeof encodeURIComponent != aq ? encodeURIComponent(b) : b
    }
    var aR = function() {
        if (ah.ie && ah.win) {
            window.attachEvent("onunload", function() {
                var a = al.length;
                for (var b = 0; b < a; b++) {
                    al[b][0].detachEvent(al[b][1], al[b][2])
                }
                var d = ag.length;
                for (var c = 0; c < d; c++) {
                    aw(ag[c])
                }
                for (var e in ah) {
                    ah[e] = null
                }
                ah = null;
                for (var f in swfobject) {
                    swfobject[f] = null
                }
                swfobject = null
            })
        }
    }();
    return {
        registerObject: function(a, e, c, b) {
            if (ah.w3 && a && e) {
                var d = {};
                d.id = a;
                d.swfVersion = e;
                d.expressInstall = c;
                d.callbackFn = b;
                aG[aG.length] = d;
                ay(a, false)
            } else {
                if (b) {
                    b({
                        success: false,
                        id: a
                    })
                }
            }
        },
        getObjectById: function(a) {
            if (ah.w3) {
                return av(a)
            }
        },
        embedSWF: function(k, e, h, f, c, a, b, i, g, j) {
            var d = {
                success: false,
                id: e
            };
            if (ah.w3 && !(ah.wk && ah.wk < 312) && k && e && h && f && c) {
                ay(e, false);
                aj(function() {
                    h += "";
                    f += "";
                    var q = {};
                    if (g && typeof g === aD) {
                        for (var o in g) {
                            q[o] = g[o]
                        }
                    }
                    q.data = k;
                    q.width = h;
                    q.height = f;
                    var n = {};
                    if (i && typeof i === aD) {
                        for (var p in i) {
                            n[p] = i[p]
                        }
                    }
                    if (b && typeof b === aD) {
                        for (var l in b) {
                            if (typeof n.flashvars != aq) {
                                n.flashvars += "&" + l + "=" + b[l]
                            } else {
                                n.flashvars = l + "=" + b[l]
                            }
                        }
                    }
                    if (ao(c)) {
                        var m = aA(q, n, e);
                        if (q.id == e) {
                            ay(e, true)
                        }
                        d.success = true;
                        d.ref = m
                    } else {
                        if (a && au()) {
                            q.data = a;
                            ae(q, n, e, j);
                            return
                        } else {
                            ay(e, true)
                        }
                    }
                    if (j) {
                        j(d)
                    }
                })
            } else {
                if (j) {
                    j(d)
                }
            }
        },
        switchOffAutoHideShow: function() {
            aI = false
        },
        ua: ah,
        getFlashPlayerVersion: function() {
            return {
                major: ah.pv[0],
                minor: ah.pv[1],
                release: ah.pv[2]
            }
        },
        hasFlashPlayerVersion: ao,
        createSWF: function(a, b, c) {
            if (ah.w3) {
                return aA(a, b, c)
            } else {
                return undefined
            }
        },
        showExpressInstall: function(b, a, d, c) {
            if (ah.w3 && au()) {
                ae(b, a, d, c)
            }
        },
        removeSWF: function(a) {
            if (ah.w3) {
                aw(a)
            }
        },
        createCSS: function(b, a, c, d) {
            if (ah.w3) {
                az(b, a, c, d)
            }
        },
        addDomLoadEvent: aj,
        addLoadEvent: aC,
        getQueryParamValue: function(b) {
            var a = aL.location.search || aL.location.hash;
            if (a) {
                if (/\?/.test(a)) {
                    a = a.split("?")[1]
                }
                if (b == null) {
                    return ai(a)
                }
                var c = a.split("&");
                for (var d = 0; d < c.length; d++) {
                    if (c[d].substring(0, c[d].indexOf("=")) == b) {
                        return ai(c[d].substring((c[d].indexOf("=") + 1)))
                    }
                }
            }
            return ""
        },
        expressInstallCallback: function() {
            if (aU) {
                var a = aS(ac);
                if (a && aJ) {
                    a.parentNode.replaceChild(aJ, a);
                    if (ad) {
                        ay(ad, true);
                        if (ah.ie && ah.win) {
                            aJ.style.display = "block"
                        }
                    }
                    if (ap) {
                        ap(at)
                    }
                }
                aU = false
            }
        }
    }
}();
(function() {
    var c = function() {
        var f = {};
        var j;
        var d = window.location.search.substring(1);
        j = d.split("&");
        for (var g = 0; g < j.length; g++) {
            var k = j[g].indexOf("=");
            if (k != -1) {
                var e = j[g].substring(0, k);
                var h = j[g].substring(k + 1);
                f[e] = unescape(h)
            }
        }
        return f
    }();
    if (c.flash == "1" || c.flash_debug == "1" || c.flash_debug_fail == "1") {
        window.WEB_SOCKET_FORCE_FLASH = true
    }
    if (c.flash_debug == "1") {
        window.WEB_SOCKET_DEBUG_FLASH = true
    }
    var b = function() {
        window.WEB_SOCKET_USING_FLASH = true;
        var d;
        if (window.WEB_SOCKET_LOGGER) {
            d = WEB_SOCKET_LOGGER
        } else {
            if (window.console && window.console.log && window.console.error) {
                d = window.console
            } else {
                d = {
                    log: function() {},
                    error: function() {},
                    warn: function() {},
                    info: function() {}
                }
            }
        }
        if (window.WEB_SOCKET_FORCE_FLASH) {
            d.warn("FORCED TO USE FLASH SOCKET")
        } else {
            d.warn("USING FLASH SOCKET FOR LACK OF WS SUPPORT")
        }
        if (swfobject.getFlashPlayerVersion().major < 10 || c.flash_debug_fail == "1") {
            d.error("Flash Player >= 10.0.0 is required.");
            window.WEB_SOCKET_USING_FLASH_BUT_NO_FLASH = true;
            if (!window.WEB_SOCKET_FORCE_FLASH) {
                return
            }
        }
        if (location.protocol == "file:") {
            d.error("WARNING: web-socket-js doesn't work in file:///... URL unless you set Flash Security Settings properly. Open the page via Web server i.e. http://...")
        }
        window.WebSocket = function(g, h, f, j, i) {
            var e = this;
            e.__id = WebSocket.__nextId++;
            WebSocket.__instances[e.__id] = e;
            e.readyState = WebSocket.CONNECTING;
            e.bufferedAmount = 0;
            e.__events = {};
            if (!h) {
                h = []
            } else {
                if (typeof h == "string") {
                    h = [h]
                }
            }
            e.__createTask = setTimeout(function() {
                WebSocket.__addTask(function() {
                    e.__createTask = null;
                    WebSocket.__flash.create(e.__id, g, h, f || null, j || 0, i || null)
                })
            }, 0)
        };
        WebSocket.prototype.send = function(f) {
            if (this.readyState == WebSocket.CONNECTING) {
                throw "INVALID_STATE_ERR: Web Socket connection has not been established"
            }
            var e = WebSocket.__flash.send(this.__id, encodeURIComponent(f));
            if (e < 0) {
                return true
            } else {
                this.bufferedAmount += e;
                return false
            }
        };
        WebSocket.prototype.close = function() {
            if (this.__createTask) {
                clearTimeout(this.__createTask);
                this.__createTask = null;
                this.readyState = WebSocket.CLOSED;
                return
            }
            if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) {
                return
            }
            this.readyState = WebSocket.CLOSING;
            WebSocket.__flash.close(this.__id)
        };
        WebSocket.prototype.addEventListener = function(f, g, e) {
            if (!(f in this.__events)) {
                this.__events[f] = []
            }
            this.__events[f].push(g)
        };
        WebSocket.prototype.removeEventListener = function(h, j, e) {
            if (!(h in this.__events)) {
                return
            }
            var g = this.__events[h];
            for (var f = g.length - 1; f >= 0;
                --f) {
                if (g[f] === j) {
                    g.splice(f, 1);
                    break
                }
            }
        };
        WebSocket.prototype.dispatchEvent = function(h) {
            var f = this.__events[h.type] || [];
            for (var e = 0; e < f.length;
                ++e) {
                f[e](h)
            }
            var g = this["on" + h.type];
            if (g) {
                g.apply(this, [h])
            }
        };
        WebSocket.prototype.__handleEvent = function(g) {
            if ("readyState" in g) {
                this.readyState = g.readyState
            }
            if ("protocol" in g) {
                this.protocol = g.protocol
            }
            var e;
            if (g.type == "open" || g.type == "error") {
                e = this.__createSimpleEvent(g.type)
            } else {
                if (g.type == "close") {
                    e = this.__createSimpleEvent("close");
                    e.wasClean = g.wasClean ? true : false;
                    e.code = g.code;
                    e.reason = g.reason
                } else {
                    if (g.type == "message") {
                        var f = decodeURIComponent(g.message);
                        e = this.__createMessageEvent("message", f)
                    } else {
                        throw "unknown event type: " + g.type
                    }
                }
            }
            this.dispatchEvent(e)
        };
        WebSocket.prototype.__createSimpleEvent = function(e) {
            if (document.createEvent && window.Event) {
                var f = document.createEvent("Event");
                f.initEvent(e, false, false);
                return f
            } else {
                return {
                    type: e,
                    bubbles: false,
                    cancelable: false
                }
            }
        };
        WebSocket.prototype.__createMessageEvent = function(e, g) {
            if (document.createEvent && window.MessageEvent && !window.opera) {
                var f = document.createEvent("MessageEvent");
                f.initMessageEvent("message", false, false, g, null, null, window, null);
                return f
            } else {
                return {
                    type: e,
                    data: g,
                    bubbles: false,
                    cancelable: false
                }
            }
        };
        WebSocket.CONNECTING = 0;
        WebSocket.OPEN = 1;
        WebSocket.CLOSING = 2;
        WebSocket.CLOSED = 3;
        WebSocket.__isFlashImplementation = true;
        WebSocket.__initialized = false;
        WebSocket.__flash = null;
        WebSocket.__instances = {};
        WebSocket.__tasks = [];
        WebSocket.__nextId = 0;
        WebSocket.loadFlashPolicyFile = function(e) {
            WebSocket.__addTask(function() {
                WebSocket.__flash.loadManualPolicyFile(e)
            })
        };
        WebSocket.__initialize = function() {
            if (window.WEB_SOCKET_USING_FLASH_BUT_NO_FLASH) {
                return
            }
            if (WebSocket.__initialized) {
                return
            }
            WebSocket.__initialized = true;
            if (WebSocket.__swfLocation) {
                window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation
            }
            if (!window.WEB_SOCKET_SWF_LOCATION) {
                d.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
                return
            }
            if (!window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR && !WEB_SOCKET_SWF_LOCATION.match(/(^|\/)WebSocketMainInsecure\.swf(\?.*)?$/) && WEB_SOCKET_SWF_LOCATION.match(/^\w+:\/\/([^\/]+)/)) {
                var g = RegExp.$1;
                if (location.host != g) {
                    d.error("[WebSocket] You must host HTML and WebSocketMain.swf in the same host ('" + location.host + "' != '" + g + "'). See also 'How to host HTML file and SWF file in different domains' section in README.md. If you use WebSocketMainInsecure.swf, you can suppress this message by WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;")
                }
            }
            var e = document.createElement("div");
            e.id = "webSocketContainer";
            e.style.position = "absolute";
            if (WebSocket.__isFlashLite()) {
                e.style.left = "0px";
                e.style.top = "0px"
            } else {
                e.style.left = "-100px";
                e.style.top = "-100px"
            }
            var f = document.createElement("div");
            f.id = "webSocketFlash";
            e.appendChild(f);
            document.body.appendChild(e);
            swfobject.embedSWF(WEB_SOCKET_SWF_LOCATION, "webSocketFlash", "1", "1", "10.0.0", null, null, {
                hasPriority: true,
                swliveconnect: true,
                allowScriptAccess: "always"
            }, null, function(h) {
                if (!h.success) {
                    d.error("[WebSocket] swfobject.embedSWF failed")
                }
            })
        };
        WebSocket.__onFlashInitialized = function() {
            setTimeout(function() {
                WebSocket.__flash = document.getElementById("webSocketFlash");
                WebSocket.__flash.setCallerUrl(location.href);
                WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG_FLASH);
                for (var e = 0; e < WebSocket.__tasks.length;
                    ++e) {
                    WebSocket.__tasks[e]()
                }
                WebSocket.__tasks = []
            }, 0)
        };
        WebSocket.__onFlashEvent = function() {
            setTimeout(function() {
                try {
                    var g = WebSocket.__flash.receiveEvents();
                    for (var f = 0; f < g.length;
                        ++f) {
                        WebSocket.__instances[g[f].webSocketId].__handleEvent(g[f])
                    }
                } catch (h) {
                    d.error(h)
                }
            }, 0);
            return true
        };
        WebSocket.__log = function(e) {
            d.log(decodeURIComponent(e))
        };
        WebSocket.__error = function(e) {
            d.error(decodeURIComponent(e))
        };
        WebSocket.__addTask = function(e) {
            if (WebSocket.__flash) {
                e()
            } else {
                WebSocket.__tasks.push(e)
            }
        };
        WebSocket.__isFlashLite = function() {
            if (!window.navigator || !window.navigator.mimeTypes) {
                return false
            }
            var e = window.navigator.mimeTypes["application/x-shockwave-flash"];
            if (!e || !e.enabledPlugin || !e.enabledPlugin.filename) {
                return false
            }
            return e.enabledPlugin.filename.match(/flashlite/i) ? true : false
        };
        if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
            swfobject.addDomLoadEvent(function() {
                WebSocket.__initialize()
            })
        }
        a()
    };
    var a = function() {
        b = function() {
            if (console && console.log) {
                console.log("useFlashForWebSockets called, but already using flash, so ignoring")
            }
        }
    };
    window.fallBackToFlashWebSockets = function() {
        window.WEB_SOCKET_FORCE_FLASH = true;
        b()
    };
    if (window.WEB_SOCKET_FORCE_FLASH) {} else {
        if (window.WebSocket) {
            return
        } else {
            if (window.MozWebSocket) {
                window.WebSocket = MozWebSocket;
                return
            }
        }
    }
    b()
})();
/*!
 * jQuery imagesLoaded plugin v2.1.1
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */
;
(function(a, b) {
    var c = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    a.fn.imagesLoaded = function(l) {
        var i = this,
            n = a.isFunction(a.Deferred) ? a.Deferred() : 0,
            m = a.isFunction(n.notify),
            f = i.find("img").add(i.filter("img")),
            g = [],
            k = [],
            h = [];
        if (a.isPlainObject(l)) {
            a.each(l, function(o, p) {
                if (o === "callback") {
                    l = p
                } else {
                    if (n) {
                        n[o](p)
                    }
                }
            })
        }

        function j() {
            var o = a(k),
                p = a(h);
            if (n) {
                if (h.length) {
                    n.reject(f, o, p)
                } else {
                    n.resolve(f)
                }
            }
            if (a.isFunction(l)) {
                l.call(i, f, o, p)
            }
        }

        function e(o) {
            d(o.target, o.type === "error")
        }

        function d(o, p) {
            if (o.src === c || a.inArray(o, g) !== -1) {
                return
            }
            g.push(o);
            if (p) {
                h.push(o)
            } else {
                k.push(o)
            }
            a.data(o, "imagesLoaded", {
                isBroken: p,
                src: o.src
            });
            if (m) {
                n.notifyWith(a(o), [p, f, a(k), a(h)])
            }
            if (f.length === g.length) {
                setTimeout(j);
                f.unbind(".imagesLoaded", e)
            }
        }
        if (!f.length) {
            j()
        } else {
            f.bind("load.imagesLoaded error.imagesLoaded", e).each(function(o, q) {
                var r = q.src;
                var p = a.data(q, "imagesLoaded");
                if (p && p.src === r) {
                    d(q, p.isBroken);
                    return
                }
                if (q.complete && q.naturalWidth !== b) {
                    d(q, q.naturalWidth === 0 || q.naturalHeight === 0);
                    return
                }
                if (q.readyState || q.complete) {
                    q.src = c;
                    q.src = r
                }
            })
        }
        return n ? n.promise(i) : i
    }
})(jQuery);