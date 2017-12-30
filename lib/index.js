function AdsFactory() {
    var _adInfo = /adinfo/.test(location.href.toLocaleLowerCase()),
        _pageVisible = true,
        _defaultData = {
            system: {
                network: 0000,
                site: "dummySite",
                selector: ".class",
                hideClass: "hide",
                center: true,
                deviceType: "desktop",
                hasAds: true,
                zone: "dummyZone//dummySubZone",
                callBack: "",
                adRefreshTimer: 0,
                includeUTP: true,
                slotsAdvance: 0
            },
            pageTargeting: {
                ugc: "0"
            },
            preroll: {
                hide: true,
                size: "640x480",
                url: ""
            },
            slots: {
                slot: {
                    id: "slot",
                    collapse: true,
                    isCompanion: false,
                    isOutOfPage: false,
                    isSkinAd: false,
                    skinAdClass: "",
                    loaded: false,
                    oneByOne: false,
                    callBack: "",
                    slotTargeting: {
                        pos: "null",
                        slot: "null",
                        inview: "1"
                    },
                    setAdToRefresh: false,
                    slotRefreshTime: 0
                }
            }
        },
        _data = {
            log: []
        },
        _getService = function() {
            if (document.querySelector("#GPT")) {
                return
            }
            window.googletag = window.googletag || {};
            window.googletag.cmd = window.googletag.cmd || [];
            var gads = document.createElement("script"),
                useSSL = "https:" === document.location.protocol;
            gads.async = true;
            gads.id = "GPT";
            gads.src = (useSSL ? "https:" : "http:") + "//www.googletagservices.com/tag/js/gpt.js";
            document.head.appendChild(gads);
            log("Page Level: Fetching GPT PubAds implementation.")
        },
        _setDefaults = function(defaults, target) {
            var str;
            for (var key in defaults) {
                if (defaults.hasOwnProperty(key)) {
                    target[key] = (target.hasOwnProperty(key)) ? _cleanString(target[key]) : defaults[key];
                    str = (target === _data.system) ? "system" : "page targeting";
                    log("Data Level: Setting " + str + " values: " + key + ": " + target[key])
                }
            }
        },
        _setFixedValues = function(target) {
            for (var key in target) {
                if (target.hasOwnProperty(key)) {
                    target[key] = _cleanString(target[key])
                }
            }
        },
        _getDomainName = function() {
            var site = window.location.host.split(".");
            site = site[site.length - 2] || "everydayhealth";
            return site
        },
        _setSite = function() {
            _data.system.site = _data.system.site || _getDomainName() || _defaultData.system.site
        },
        _setZone = function() {
            var zone = _data.system.zone;
            zone = zone.toLowerCase().split("/").filter(Boolean);
            zone = zone.filter(function(item, pos, self) {
                return self.indexOf(item) === pos
            });
            zone = zone.join("//");
            return zone
        },
        _cleanString = function(string, regex, sub) {
            var re1 = new RegExp(regex || "[^a-zA-Z0-9]$-_", "gi"),
                re2 = new RegExp(" ", "gi");
            sub = sub || "_";
            return (string && string.constructor === String) ? string.replace(re2, sub).replace(re1, sub) : string
        },
        _updateData = function(obj, key, val) {
            key = _cleanString(key);
            val = _cleanString(val);
            if (obj[key] && Array.isArray(obj[key])) {
                obj[key].push(val);
                return obj[key]
            }
            if (obj[key] && !Array.isArray(obj[key])) {
                obj[key] = obj[key].split();
                obj[key].push(val);
                return obj[key]
            }
            obj[key] = val;
            return obj[key]
        },
        _setPlt = function() {
            var type = _data.system && _data.system.deviceType && _data.system.deviceType.toLowerCase();
            if (type) {
                var val = (type === "desktop") ? "desktop" : "mobile";
                _updateData(_data.pageTargeting, "plt", val)
            }
        },
        _setMdv = function() {
            var type = _data.system && _data.system.deviceType && _data.system.deviceType.toLowerCase();
            var val;
            if (type && type !== "desktop") {
                val = (type === "tablet" ? "tablet" : "mobile");
                _updateData(_data.pageTargeting, "device", val)
            }
        },
        _setSrc = function() {
            var x = _data.query && _data.query.xid;
            if (x) {
                _updateData(_data.pageTargeting, "src", x && x.split("_")[0])
            }
        },
        _setRef = function() {
            var x = document.referrer && document.referrer.split("/")[2],
                t = new RegExp(_data.system.site);
            if (x && !t.test(x)) {
                _updateData(_data.pageTargeting, "ref", _cleanString(x))
            }
        },
        _setTestAds = function() {
            var zt = _data.query && _data.query.test_ads || "";
            if (zt.length) {
                _updateData(_data.pageTargeting, "zt", "test_" + zt)
            }
        },
        _setHasAds = function() {
            _data.system.hasAds = _data.query && !_data.query.no_ads
        },
        _setStringArray = function(str, target, sep1, sep2) {
            var temp = str && str.split(sep1 || ";"),
                i = temp && temp.length || 0,
                _this;
            while (i--) {
                _this = temp[i] && temp[i].split(sep2 || "=");
                if (_this && _this[1]) {
                    _updateData(target, _this[0], _this[1])
                }
            }
        },
        _getCookie = function(name) {
            var cookies = document.cookie.split("; "),
                i = cookies.length,
                val;
            while (i--) {
                val = cookies[i].split("=");
                if (val[0] === name) {
                    return window.unescape(val[1])
                }
            }
            return ""
        },
        _populateData = function(data) {
            window.utp = window.utp || "u=null;p=null";
            data = (data) ? data : _defaultData;
            if (window.googletag && window.googletag.pubads && window.googletag.pubads().updateCorrelator) {
                window.googletag.pubads().updateCorrelator()
            }
            if (!_data.query) {
                _populateDataInit(data)
            } else {
                _populateDataContinuous(data)
            }
            _data.system.zone = _setZone();
            _cleanCat();
            _setPlt();
            _setMdv();
            _setSite();
            _setRef();
            _setSlotSizes();
            _setTestAds();
            _setSrc();
            _setHasAds();
            _setFixedValues(_data.pageTargeting)
        },
        _populateDataInit = function(data) {
            _data = Object.create(data);
            _data.system = _data.system;
            _data.pageTargeting = _data.pageTargeting;
            _data.slots = _data.slots;
            _data.log = [
                ["FAST: loading", new Date().getTime()]
            ];
            _setDefaults(_defaultData.system, _data.system);
            _setDefaults(_defaultData.pageTargeting, _data.pageTargeting);
            _data.query = {};
            _setStringArray(window.location.search.split("?")[1], _data.query, "&", "=");
            if (_data.system.includeUTP) {
                _setStringArray(window.utp.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, ""), _data.pageTargeting)
            }
            if (_getCookie("aamdfp")) {
                _setStringArray(_getCookie("aamdfp"), _data.pageTargeting)
            }
            if (_getCookie("aam_uuid")) {
                _updateData(_data.pageTargeting, "AdobeID", _getCookie("aam_uuid"))
            }
        },
        _populateDataContinuous = function(data) {
            for (var syskey in data.system) {
                if (data.system.hasOwnProperty(syskey)) {
                    _data.system[syskey] = data.system[syskey]
                }
            }
            for (var pagekey in data.pageTargeting) {
                if (data.pageTargeting.hasOwnProperty(pagekey)) {
                    _data.pageTargeting[pagekey] = data.pageTargeting[pagekey]
                }
            }
            for (var slotkey in data.slots) {
                if (data.slots.hasOwnProperty(slotkey) && !_data.slots.hasOwnProperty(slotkey)) {
                    _updateData(_data.slots, slotkey, data.slots[slotkey])
                }
            }
        },
        log = function(evt) {
            var pre = "AdsLib.FAST: ",
                date = new Date().getTime();
            _data.log.push([date, pre + evt]);
            if (_adInfo && window.console) {
                _showLog(_data.log.length - 1 || 0)
            }
        },
        _showLog = function(item) {
            var x = (window.console && window.console.info) ? "info" : "log";
            window.console[x](_data.log[item][0] + " - " + _data.log[item][1])
        },
        _setPageTags = function() {
            var data = _data.pageTargeting;
            window.googletag.cmd.push(function() {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        window.googletag.pubads().setTargeting(key, data[key])
                    }
                }
            })
        },
        _defineSlot = function(slot) {
            var sys = _data.system;
            if (slot.ad) {
                return
            }
            var slotZone = "/" + _data.system.network + "/" + sys.site + "/" + (slot.zone || sys.zone);
            slot.ad = window.googletag.defineSlot(slotZone, slot.size, slot.id).addService(window.googletag.pubads());
            log("Slot Level: " + slot.id + " - Define slot : " + slotZone + ", " + JSON.stringify(slot.size))
        },
        _defineOOPSlot = function(slot) {
            var sys = _data.system;
            if (slot.ad) {
                return
            }
            slot.ad = window.googletag.defineOutOfPageSlot("/" + _data.system.network + "/" + sys.site + "/" + sys.zone, slot.id).addService(window.googletag.pubads());
            log("Slot Level: " + slot.id + "Define OOP Slot : /" + _data.system.network + "/" + sys.site + "/" + _data.system.zone)
        },
        _renderSkinAd = function(slot, slotId) {
            var adSlotNode = document.getElementById(slotId),
                iframeNode = adSlotNode.querySelector('iframe[id^="google_ads_iframe"]'),
                skinAdNode = adSlotNode.querySelector('div[id^="google_ads_iframe"]'),
                settingsNode = iframeNode.contentWindow.document.getElementById("settingsDiv") || skinAdNode,
                settings;
            if (skinAdNode.getAttribute("data-creative") || settingsNode !== null) {
                settings = _getSkinSettings(settingsNode, adSlotNode);
                settings.className = slot.skinAdClass;
                _setSkinSettings(skinAdNode, settings);
                window.addEventListener("resize", function() {
                    _setSkinSettings(skinAdNode, settings)
                })
            }
        },
        _getSkinSettings = function(settingsNode, adSlotNode) {
            var settings = {
                skinSmMin: adSlotNode.getAttribute("data-skin-sm-min") || 768,
                skinMdMin: adSlotNode.getAttribute("data-skin-md-min") || 980,
                skinLgMin: adSlotNode.getAttribute("data-skin-md-max") || 1199,
                locked: settingsNode.getAttribute("data-locked"),
                clickthrough: settingsNode.getAttribute("data-clickthrough"),
                creative: settingsNode.getAttribute("data-creative")
            };
            settings.creativeSm = settingsNode.getAttribute("data-creative-sm") || settings.creative;
            settings.creativeMd = settingsNode.getAttribute("data-creative-md") || settings.creative;
            return settings
        },
        _setSkinSettings = function(skinAdNode, settings) {
            var background = _getAdSkinBackground(settings);
            if (background !== "" && background !== null) {
                skinAdNode.className = settings.className;
                skinAdNode.style.background = "url('" + background + "')";
                skinAdNode.style.position = settings.locked == "yes" ? "fixed" : "absolute";
                skinAdNode.innerHTML = '<div class="skin-ad-gradient"></div><a href=\'' + settings.clickthrough + "' target='_blank'></a>"
            }
        },
        _getSmallAdSkin = function(settings, width) {
            return (settings.skinSmMin <= width) && (width < settings.skinMdMin) ? settings.creativeSm : false
        },
        _getMediumAdSkin = function(settings, width) {
            return ((settings.skinMdMin <= width) && (width < settings.skinLgMin)) ? settings.creativeMd : false
        },
        _getAdSkinBackground = function(settings) {
            var w = _getViewportWidth();
            return (_getSmallAdSkin(settings, w) || _getMediumAdSkin(settings, w) || settings.creative)
        },
        _adEventListner = function() {
            log('Page Level: Event added "slotRenderEnded".');
            window.googletag.cmd.push(function() {
                window.googletag.pubads().addEventListener("slotRenderEnded", function(event) {
                    var slotid = event.slot.getSlotId().getDomId(),
                        slot = _data.slots[slotid],
                        src = slot.ad.getContentUrl(),
                        adNode = document.querySelector("#" + slotid),
                        trackerNode = document.createElement("span");
                    trackerNode.id = slotid + "track";
                    adNode.parentNode.insertBefore(trackerNode, adNode);
                    slot.correlator = src.split("correlator=")[1].split("&")[0];
                    _data.system.correlator = slot.correlator;
                    slot.creativeId = event.creativeId;
                    slot.lineItemId = event.lineItemId;
                    slot.width = event.size && event.size[0];
                    slot.height = event.size && event.size[1];
                    slot.src = src;
                    slot.adUnitId = slot.ad.getAdUnitPath();
                    eval(slot.callBack);
                    _isOneByOne(slotid);
                    if (slot.isSkinAd) {
                        setTimeout(function() {
                            _renderSkinAd(slot, slotid)
                        }, 500)
                    }
                    if (_isDebug()) {
                        _addDebug(slotid)
                    }
                    log(slotid + " Ad received. Correlator: " + slot.correlator + " Creative: " + event.creativeId);
                    if (slot.callBack) {
                        log(slotid + " Callback triggered: " + slot.callBack)
                    }
                })
            })
        },
        _setSlotTags = function() {
            var slots = _data.slots;
            window.googletag.cmd.push(function() {
                for (var key in slots) {
                    if (slots.hasOwnProperty(key) && !slots[key].ad) {
                        _pushSlot(slots[key]);
                        window.googletag.display(slots[key].id);
                        log("Slot Level: " + slots[key].id + " - Call display")
                    }
                }
            })
        },
        _setSlotSizes = function() {
            var s = _data.slots;
            for (var key in s) {
                if (s.hasOwnProperty(key)) {
                    if (!s[key].size) {
                        s[key].size = /(leader)/.test(s[key].slotTargeting.slot) ? [
                            [728, 90]
                        ] : [
                            [300, 250]
                        ]
                    }
                }
            }
        },
        _pushSlot = function(slot) {
            log("Slot Level: " + slot.id + " - Setting slot level values.");
            if (slot.isOutOfPage) {
                _defineOOPSlot(slot)
            } else {
                _defineSlot(slot)
            }
            _isCompanion(slot);
            _isCollapse(slot);
            _setSlotTargeting(slot);
            _setSizeMapping(slot)
        },
        _setSlotTargeting = function(slot) {
            for (var key in slot.slotTargeting) {
                if (slot.slotTargeting.hasOwnProperty(key)) {
                    slot.ad.setTargeting(key, slot.slotTargeting[key]);
                    log("Slot Level: " + slot.id + " - Slot target: " + key + ": " + slot.slotTargeting[key])
                }
            }
        },
        _setSizeMapping = function(slot) {
            if (slot.sizeMapping && typeof slot.sizeMapping === "object") {
                slot.ad.defineSizeMapping(slot.sizeMapping);
                log(slot.id + " - Define Size Mapping: " + JSON.stringify(slot.sizeMapping))
            }
        },
        _isCompanion = function(slot) {
            if (slot.isCompanion) {
                slot.ad.addService(window.googletag.companionAds());
                window.googletag.cmd.push(function() {
                    window.googletag.companionAds().setRefreshUnfilledSlots(true)
                });
                _data.system.hasCompanion = true;
                log("Slot Level: " + slot.id + " - Add service: companionAds")
            }
        },
        _hasVideo = function() {
            if (!_data.preroll) {
                return false
            }
            window.googletag.cmd.push(function() {
                window.googletag.pubads().enableVideoAds()
            });
            log("Page Level: Add service: VideoAds");
            return true
        },
        _setCompanion = function() {
            if (_data.system.hasCompanion) {
                window.googletag.cmd.push(function() {
                    window.googletag.companionAds().setRefreshUnfilledSlots(true)
                })
            }
        },
        _isCollapse = function(slot) {
            if (slot.collapse) {
                slot.ad.setCollapseEmptyDiv(true);
                log("Slot Level: " + slot.id + " - Add service: Collapse empty div after render.")
            }
        },
        _buildDebug = function(slot) {
            var _div = document.createElement("div"),
                _table = document.createElement("table"),
                arr = _cleanDebugUrl(slot.src),
                css = "border: 1px solid rgb(0, 153, 0); position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: scroll;";
            css += "padding: 10px; z-index: 2000010; resize: both; font-style: normal; font-variant: normal; font-weight: normal;";
            css += "font-stretch: normal; font-size: 13px; line-height: 150%; text-align: left; background-color: rgb(255, 248, 224);";
            if (!arr.length) {
                return false
            }
            _div.appendChild(_table);
            _div.style.cssText = css;
            _div.className = "debugadcode";
            _buildTable(_table, slot, arr);
            return _div
        },
        _buildTable = function(table, slot, arr) {
            var keys = slot.ad.getTargetingKeys();
            arr.map(function(i) {
                i = i.split("=");
                _adTableRow(table, i[0], i[1])
            });
            _adTableRow(table, "Slot Targeting", '');
            if (keys.length) {
                keys.map(function doit(i) {
                  _adTableRow(table, i, slot.ad.getTargeting(i));
                });
            }
            _adTableRow(table, "Correlator", slot.ad.getServices()[0].getCorrelator());
            _adTableRow(table, "ad Unit Id", slot.adUnitId || '?');
            _adTableRow(table, "Decode URL", '<input type="text" style="width:100%;" value="' + decodeURIComponent(decodeURIComponent(slot.src)) + '"></input>');
            var link = [
                '<a href="https://www.google.com/dfp/',
                _data.system.network,
                '#delivery/CreativeDetail/creativeId=',
                slot.creativeId,
                '">',
                slot.creativeId,
                '</a> &#8627;'
            ];
            _adTableRow(table, "Creative id", link.join() || '?');
            _adTableRow(table, "Line Item", slot.lineItemId || '?');
            _adTableRow(table, "Size", slot.width ? slot.width + "x" + slot.height : '?x?');
            _adTableRow(table, "Ad Unit Path", slot.ad.getAdUnitPath() || '');

            return table
        },
        _cleanDebugUrl = function(str) {
            var arr = decodeURIComponent(decodeURIComponent(str)).split("?")[1] || "";
            arr = arr.split("&scp=")[1] || arr;
            arr = arr.split("&cookie")[0] || arr;
            arr = arr.split("&cust_params=").join("&");
            arr = arr.split("&") || arr;
            return arr
        },
        _adTableRow = function(table, label, value) {
            var row = table.insertRow(0);
            row.insertCell(0).innerHTML = '<b style="display:inline-block;min-width:100px">' + label + ":</b> ", row.insertCell(1).innerHTML = value
        },
        _removeDebug = function(id) {
            var slots = _data.slots;
            if (id) {
                _removeDebugDiv(id)
            } else {
                for (var key in slots) {
                    if (slots.hasOwnProperty(key)) {
                        _removeDebugDiv(slots[key].id)
                    }
                }
            }
        },
        _removeDebugDiv = function(id) {
            var container = document.getElementById(id),
                child = container && container.getElementsByClassName("debugadcode")[0];
            if (child) {
                container.removeChild(child);
                log(id + " - Debug block cleared.")
            }
        },
        _addDebug = function(id) {
            _removeDebug(_data.slots[id].id);
            var container = document.getElementById(_data.slots[id].id),
                frame;
            if (container) {
                frame = container.children[0];
                container.style.position = "relative";
                log(id + " - Debug block added.");
                return frame && container.insertBefore(_buildDebug(_data.slots[id]), frame)
            }
            return false
        },
        _isDebug = function() {
            return /debugadcode/i.test(location.search.split("?")[1])
        },
        _setAdsEnabled = function() {
            if (!window.googletag.impl) {
                window.googletag.cmd.push(function() {
                    window.googletag.pubads().setCentering(_data.system.center);
                    window.googletag.pubads().disableInitialLoad();
                    window.googletag.enableServices()
                });
                log("Page Level: Setting centering to " + _data.system.center);
                log("Page Level: disable initial load.");
                log("Page Level: Enabling Services.")
            }
        },
        _loadOne = function(id) {
            if (!_data.slots[id].loaded) {
                window.googletag.cmd.push(function() {
                    window.googletag.pubads().refresh([_data.slots[id].ad], {
                        changeCorrelator: false
                    })
                });
                _data.slots[id].loaded = true;
                log("Slot Level: " + id + " Regestering ad with GPT.")
            }
        },
        _hideAd = function(id) {
            var slots = _data.slots;
            if (id && !document.getElementById(id)) {
                return false
            }
            if (id) {
                _addClass(document.getElementById(id));
                log(id + " - has been hidden.")
            } else {
                for (var key in slots) {
                    if (slots.hasOwnProperty(key)) {
                        _addClass(document.getElementById(slots[key].id));
                        log(slots[key].id + " - has been hidden.")
                    }
                }
            }
            return false
        },
        _isOneByOne = function(id) {
            var bool = document.getElementById(id) && document.getElementById(id).querySelector("iframe") && !!document.getElementById(id).querySelector("iframe").contentDocument.body.querySelector("[src$='1x1.JPG']");
            _data.slots[id].oneByOne = bool;
            if (bool) {
                _hideAd(id);
                log(id + " - is a 1x1 ad and has been hidden.")
            }
        },
        _show = function(id) {
            var slots = _data.slots;
            if (id && !document.getElementById(id)) {
                return false
            }
            if (id) {
                _removeClass(document.getElementById(id))
            } else {
                for (var key in slots) {
                    if (slots.hasOwnProperty(key)) {
                        _removeClass(document.getElementById(slots[key].id))
                    }
                }
            }
            return false
        },
        _addClass = function(el) {
            if (!el || typeof el.className !== "string") {
                return
            }
            var classString = el.className,
                newClass = classString.concat(" " + _data.system.hideClass);
            el.className = newClass
        },
        _removeClass = function(el) {
            if (!el || !el.className) {
                return
            }
            var classString = el.className,
                newClass = classString.replace(_data.system.hideClass, "").trim();
            el.className = newClass
        },
        _isLoadable = function(id, forceLoad) {
            if (!_data.slots[id].loaded && forceLoad === true) {
                return true
            }
            if (!_data.system.hasAds || !document.getElementById(id) || !_isVisible("#" + id) || !_data.slots[id].ad) {
                return false
            }
            if (!_data.slots[id].loaded && forceLoad !== true) {
                if ((_data.slots[id].slotTargeting && _data.slots[id].slotTargeting.inview === "0" && _isVisible("#" + id)) || _isInView("#" + id)) {
                    return true
                }
            }
            return false
        },
        _isInView = function(el) {
            var size = {},
                sizeProto = _getElementSize(el);
            if (!_pageVisible) {
                return false
            }
            if (_data.system.slotsAdvance) {
                size.bottom = sizeProto.bottom + _data.system.slotsAdvance;
                size.height = sizeProto.height;
                size.left = sizeProto.left;
                size.right = sizeProto.right;
                size.top = sizeProto.top - _data.system.slotsAdvance;
                size.width = sizeProto.width;
                log("prefetching of slots is enabled and set to " + _data.system.slotsAdvance + "px. top and bottom sizes of the slot " + el + " were changed")
            } else {
                size = sizeProto
            }
            if (size) {
                return !(_isBelowTheFold(size) || _isAboveTheTop(size) || _isLeftOfScreen(size) || _isRightOfScreen(size)) && _isVisible(el)
            } else {
                return false
            }
        },
        _getViewportHeight = function() {
            var result = _data.system.windowHeight = window.innerHeight || document.documentElement.clientHeight;
            return result
        },
        _cleanCat = function() {
            var cat = _data.pageTargeting.cat,
                sep = /(;)/.test(cat) ? ";" : /(;)/.test(cat) ? ";" : "";
            if (!cat || typeof cat === "object" || !sep) {
                return false
            }
            cat = cat.replace(/cat=/gi, "");
            if (sep) {
                cat = cat.split(sep).filter(Boolean)
            }
            log("Data Level: Cleaning cat: " + cat);
            return _data.pageTargeting.cat = cat
        },
        _getViewportWidth = function() {
            var result = _data.system.windowWidth = window.innerWidth || document.documentElement.clientWidth;
            return result
        },
        _getElementSize = function(el) {
            var element = document.querySelector(el) && document.querySelector(el).getBoundingClientRect(),
                tracker = document.querySelector(el + "track") && document.querySelector(el + "track").getBoundingClientRect(),
                elm = (element && (element.bottom || element.height || element.left || element.right || element.top || element.width) ? element : tracker) || element;
            return elm
        },
        _isBelowTheFold = function(size) {
            return size.top > _data.system.windowHeight
        },
        _isAboveTheTop = function(size) {
            return size.bottom < 0
        },
        _isLeftOfScreen = function(size) {
            return size.right < 0
        },
        _isRightOfScreen = function(size) {
            return size.left > _data.system.windowWidth
        },
        _getStyle = function(el, prop) {
            if (getComputedStyle !== "undefined") {
                return getComputedStyle(el, null).getPropertyValue(prop)
            } else {
                return el.currentStyle[prop]
            }
        },
        _isVisible = function(el) {
            var elm = typeof el === "object" ? el : document.querySelector(el),
                p = elm.parentNode,
                id = elm.id,
                isAd = id && _data.slots[id] && _data.slots[id].ad,
                isCollapse = isAd && /display: none/.test(elm.getAttribute("style")),
                viz = isCollapse || ["opacity", "display", "visibility"].reduce(function(t, c) {
                    return t && !/(0|none|hidden)/.test(_getStyle(elm, c))
                }, true);
            if (!viz) {
                return false
            }
            if (p && p.nodeType === 9) {
                return true
            }
            return _isVisible(p)
        },
        _attach = function() {
            if (_data.system.hasAds && !!window.googletag.impl) {
                var prefix = _getBrowserPrefix(),
                    hidden = _getHiddenProperty(prefix),
                    visibilityEvent = _getVisibilityEvent(prefix);
                _checkSize();
                window.onresize = _checkSize;
                window.onscroll = _scroll;
                document.addEventListener(visibilityEvent, function() {
                    if (!document[hidden]) {
                        _pageVisible = true;
                        window.scrollBy(0, 1);
                        window.scrollBy(0, -1)
                    } else {
                        _pageVisible = false
                    }
                    log("Page Level: The tab is now visible? " + _pageVisible)
                });
                log("Page Level: Resize and scroll events attached.")
            } else {
                window.setTimeout(_attach, 50)
            }
        },
        _checkSize = function() {
            _getViewportHeight();
            _getViewportWidth();
            _scroll()
        },
        _scroll = function() {
            var slots = _data.slots;
            _load();
            for (var key in slots) {
                if (slots[key].hasOwnProperty("loaded") && slots[key].loaded) {
                    _refreshAdInQue(key)
                }
            }
        },
        _load = function(id, forceLoad) {
            var slots = _data.slots;
            if (id && _isLoadable(id, forceLoad)) {
                _loadOne(id)
            } else {
                for (var key in slots) {
                    if (slots.hasOwnProperty(key) && _isLoadable(slots[key].id)) {
                        _loadOne(slots[key].id)
                    }
                }
            }
        },
        _getBrowserPrefix = function() {
            if ("hidden" in document) {
                return null
            }
            var browserPrefixes = ["moz", "ms", "o", "webkit"];
            for (var i = 0; i < browserPrefixes.length; i++) {
                var prefix = browserPrefixes[i] + "Hidden";
                if (prefix in document) {
                    return browserPrefixes[i]
                }
            }
            return null
        },
        _getHiddenProperty = function(prefix) {
            if (prefix) {
                return prefix + "Hidden"
            } else {
                return "hidden"
            }
        },
        _getVisibilityEvent = function(prefix) {
            if (prefix) {
                return prefix + "Visibilitychange"
            } else {
                return "visibilitychange"
            }
        },
        _refresh = function(id) {
            var slots = _data.slots;
            if (!_data.system.hasAds || (id && !_isRefreshable(id))) {
                return false
            }
            if (id && _isRefreshable(id)) {
                window.googletag.pubads().refresh([slots[id].ad], {
                    changeCorrelator: true
                });
                log(id + " Refreshing slot.")
            }
            if (!id) {
                window.googletag.pubads().updateCorrelator();
                for (var key in slots) {
                    if (slots.hasOwnProperty(key)) {
                        if (_isRefreshable(key)) {
                            window.googletag.pubads().refresh([slots[key].ad], {
                                changeCorrelator: false
                            });
                            slots[key].setAdToRefresh = false;
                            log(key + " : Refreshing slot.")
                        } else {
                            if (_data.slots[key].loaded) {
                                slots[key].setAdToRefresh = true;
                                log(key + " : will refresh later.")
                            }
                            log(key + " : has not yet loaded so will not refresh.")
                        }
                    }
                }
            }
            return false
        },
        _isRefreshable = function(id) {
            var slot = _data.slots[id];
            if (_pageVisible && document.getElementById(id) && _isVisible("#" + id) && slot.ad && !slot.isOutOfPage && !slot.interstitial) {
                if ((_data.slots[id].slotTargeting && _data.slots[id].slotTargeting.inview === "0") || _isInView("#" + id)) {
                    return true
                }
            }
            return false
        },
        _refreshAdInQue = function(id) {
            var slot = _data.slots[id];
            if (slot && !slot.isOutOfPage && !slot.interstitial) {
                if (_isInView("#" + id) && slot.setAdToRefresh) {
                    window.googletag.pubads().refresh([slot.ad], {
                        changeCorrelator: false
                    });
                    slot.setAdToRefresh = false;
                    log(slot.id + " Refreshed.")
                }
            }
        },
        _getPrerollUrl = function(source) {
            if (!_data.preroll) {
                return ""
            }
            var pt = _data.pageTargeting,
                custom = "&competitiveExclusionMode=off&scp=slot%3Dpreroll%26pos%3Dvideo&cust_params=",
                url = "//pubads.g.doubleclick.net/gampad/ads?sz=" + _data.preroll.size + "&gdfp_req=1&iu=/" + _data.system.network + "/",
                srcstr = (typeof source === "string") ? "bcsrc%3D" + source : "",
                str;
            url += _data.system.site + "/" + _data.system.zone + "&url=[referrer_url]&correlator=" + _data.system.correlator;
            url += "&env=vp&unviewed_position_start=1&output=xml_vast3&impl=s";
            for (var key in pt) {
                if (pt.hasOwnProperty(key)) {
                    str = Array.isArray(pt[key]) ? pt[key].join("%2C") : pt[key];
                    custom += key + "%3D" + str + "%26"
                }
            }
            _data.preroll.url = url + custom + srcstr;
            log("Generating preroll url.");
            log(_data.preroll.url);
            return _data.preroll.url
        },
        _isTimerOn = function() {
            var slots = _data.slots,
                adTimer = _data.system.adRefreshTimer;
            if (slots && adTimer && adTimer > 0) {
                for (var key in slots) {
                    if (slots[key] && slots.hasOwnProperty(key) && slots[key].isOutOfPage) {
                        slots[key].setAdToRefresh = adTimer
                    }
                }
                return adTimer
            }
            return false
        },
        _refreshAdOnTimer = function() {
            var timer = _isTimerOn();
            if (timer) {
                setInterval(_refresh, timer)
            }
        };
    this._version = function() {
        return "2.0.0"
    };
    this._init = function(data) {
        _populateData(data);
        log("Page Level: Calling init");
        if (data && data.system && (data.system.hasAds === undefined || data.system.hasAds) && !/no_ads/.test(location.search.toLocaleLowerCase())) {
            _getService();
            _setPageTags();
            _setCompanion();
            _hasVideo();
            _setAdsEnabled();
            eval(data.system.callBack);
            _setSlotTags();
            _adEventListner();
            _attach();
            _refreshAdOnTimer()
        } else {
            log("Ads are disabled.");
            _hideAd()
        }
    };
    this._getData = function() {
        return _data
    };
    this._load = function(id, forceLoad) {
        return _load(id, forceLoad)
    };
    this._refresh = function(id) {
        return _refresh(id)
    };
    this._debug = function(id) {
        var slots = _data.slots;
        if (id) {
            _addDebug(id, true)
        } else {
            for (var key in slots) {
                if (slots.hasOwnProperty(key)) {
                    _addDebug(slots[key].id, true)
                }
            }
        }
    };
    this._removeDebug = function(id) {
        return (id) ? _removeDebug(id) : _removeDebug()
    };
    this._toggleUgc = function() {
        var ugc = _data.pageTargeting.ugc || 0;
        ugc = (ugc === "0") ? "1" : "0";
        window.googletag.cmd.push(function() {
            window.googletag.pubads().setTargeting("ugc", ugc)
        });
        return _data.pageTargeting.ugc = ugc
    };
    this._isInView = function(el) {
        return _isInView(el)
    };
    this._hide = function(id) {
        return (id) ? _hideAd(id) : _hideAd()
    };
    this._show = function(id) {
        return (id) ? _show(id) : _show()
    };
    this._showLog = function() {
        var data = _data.log.reverse(),
            i = data.length;
        while (i--) {
            _showLog(i)
        }
        _adInfo = true
    };
    this._getPreroll = function(source) {
        return _getPrerollUrl(source)
    }
}

AdsFactory.prototype = {
    init: function(a) {
        this._init(a)
    },
    renderSkinAd: function(a, b) {
        return this._renderSkinAd(a, b)
    },
    version: function() {
        return this._version()
    },
    data: function() {
        return this._getData()
    },
    load: function(b, a) {
        return (b) ? this._load(b, a) : this._load(null, a)
    },
    refresh: function(a) {
        return this._refresh(a)
    },
    debug: function(a) {
        return (a) ? this._debug(a) : this._debug()
    },
    removeDebug: function(a) {
        return (a) ? this._removeDebug(a) : this._removeDebug()
    },
    toggleUgc: function() {
        return this._toggleUgc()
    },
    isInView: function(a) {
        return this._isInView(a)
    },
    hide: function(a) {
        return (a) ? this._hide(a) : this._hide()
    },
    show: function(a) {
        return (a) ? this._show(a) : this._show()
    },
    showLog: function() {
        return this._showLog()
    },
    getPreroll: function(a) {
        return this._getPreroll(a)
    }
};
