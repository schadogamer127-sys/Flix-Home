/* HDMI inputs via tizen.systeminfo (VIDEOSOURCE) and tizen.tvwindow. */
(function () {
    'use strict';

    var VIEWER_APP = 'org.tizen.tv-viewer';
    var FULL = ['0px', '0px', '1920px', '1080px'];

    function call(fn, what) {
        return Apps.withTimeout(new Promise(function (resolve, reject) {
            try { fn(resolve, reject); } catch (e) { reject(e); }
        }), 8000, what);
    }

    function sources() {
        return call(function (ok, err) {
            tizen.systeminfo.getPropertyValue('VIDEOSOURCE', ok, err);
        }, 'Input list');
    }

    function describeSource(s) {
        return s ? s.type + (s.type === 'TV' ? '' : ' ' + s.number) : 'unknown';
    }

    function current() {
        try {
            return tizen.tvwindow.getSource('MAIN');
        } catch (e) {
            return null;
        }
    }

    // Returns { 1: true, 2: false, ... } for HDMI ports the TV reports.
    function hdmiStatus() {
        return sources().then(function (info) {
            var status = {};
            (info.disconnected || []).forEach(function (s) { if (s.type === 'HDMI') status[s.number] = false; });
            (info.connected || []).forEach(function (s) { if (s.type === 'HDMI') status[s.number] = true; });
            return status;
        });
    }

    function findHdmi(n) {
        return sources().then(function (info) {
            var all = (info.connected || []).concat(info.disconnected || []);
            var src = all.find(function (s) { return s.type === 'HDMI' && s.number === n; });
            if (!src) throw new Error('HDMI ' + n + ' is not reported by the TV');
            return src;
        });
    }

    function setSource(src) {
        return call(function (ok, err) { tizen.tvwindow.setSource(src, ok, err, 'MAIN'); }, 'Switch input');
    }

    function showFull() {
        return call(function (ok, err) { tizen.tvwindow.show(ok, err, FULL, 'MAIN'); }, 'Show input');
    }

    function hide() {
        return call(function (ok, err) { tizen.tvwindow.hide(ok, err, 'MAIN'); }, 'Hide input');
    }

    function openViewer() {
        return Apps.launch(VIEWER_APP);
    }

    // Resolves to 'inapp' when the input is now showing inside the launcher, otherwise 'external'.
    function open(hdmi, method) {
        return findHdmi(hdmi).then(function (src) {
            return setSource(src).then(function () {
                if (method === 'switch') return 'external';
                if (method === 'inapp') return showFull().then(function () { return 'inapp'; });
                return openViewer().then(function () { return 'external'; });
            });
        });
    }

    window.Inputs = {
        sources: sources,
        hdmiStatus: hdmiStatus,
        current: current,
        describeSource: describeSource,
        open: open,
        hide: hide,
        openViewer: openViewer
    };
})();
