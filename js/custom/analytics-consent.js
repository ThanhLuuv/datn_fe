/*
  analytics-consent.js
  - Shows a small cookie/analytics consent banner to the user
  - If user accepts, loads Google Analytics (gtag) with the configured measurement ID
  - If user declines, does not load analytics

  IMPORTANT: The legal requirement to ask for consent depends on jurisdiction.
  Keep the GA ID in this file or move to server-side config. Do NOT enable
  analytics without obtaining explicit user consent where required.
*/
(function () {
    var GA_MEASUREMENT_ID = 'G-F81GVPMBK0'; // Change here if needed
    var CONSENT_COOKIE = 'ga_consent';
    var COOKIE_EXP_DAYS = 365;

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    function getCookie(name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function loadGtag() {
        if (!GA_MEASUREMENT_ID) return;

        // Prevent double-loading
        if (window.__gtag_loaded) return;
        window.__gtag_loaded = true;

        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
        document.head.appendChild(s);

        var inline = document.createElement('script');
        inline.text = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '" + GA_MEASUREMENT_ID + "');";
        document.head.appendChild(inline);
    }

    function createBanner() {
        // Banner container
        var container = document.createElement('div');
        container.id = 'ga-consent-banner';
        container.style.position = 'fixed';
        container.style.left = '16px';
        container.style.right = '16px';
        container.style.bottom = '16px';
        container.style.zIndex = '99999';
        container.style.background = 'rgba(15,23,42,0.95)';
        container.style.color = 'white';
        container.style.padding = '12px 16px';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.gap = '12px';
        container.style.fontSize = '14px';

        var message = document.createElement('div');
        message.style.flex = '1';
        message.innerHTML = '<strong>Chúng tôi sử dụng cookie</strong> để cải thiện trải nghiệm và cho mục đích phân tích. Bạn đồng ý bật Google Analytics không?';

        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        var accept = document.createElement('button');
        accept.textContent = 'Đồng ý';
        accept.style.background = '#16a34a';
        accept.style.border = 'none';
        accept.style.color = 'white';
        accept.style.padding = '8px 12px';
        accept.style.borderRadius = '6px';
        accept.style.cursor = 'pointer';

        var decline = document.createElement('button');
        decline.textContent = 'Từ chối';
        decline.style.background = 'transparent';
        decline.style.border = '1px solid rgba(255,255,255,0.12)';
        decline.style.color = 'white';
        decline.style.padding = '8px 12px';
        decline.style.borderRadius = '6px';
        decline.style.cursor = 'pointer';

        accept.addEventListener('click', function () {
            setCookie(CONSENT_COOKIE, 'granted', COOKIE_EXP_DAYS);
            loadGtag();
            removeBanner();
        });

        decline.addEventListener('click', function () {
            setCookie(CONSENT_COOKIE, 'denied', COOKIE_EXP_DAYS);
            removeBanner();
        });

        actions.appendChild(decline);
        actions.appendChild(accept);

        container.appendChild(message);
        container.appendChild(actions);

        document.body.appendChild(container);
    }

    function removeBanner() {
        var el = document.getElementById('ga-consent-banner');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    // Initialize
    try {
        var consent = getCookie(CONSENT_COOKIE);
        if (consent === 'granted') {
            loadGtag();
        } else if (consent === 'denied') {
            // do nothing
        } else {
            // Show banner after short delay so it doesn't block initial rendering
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () { setTimeout(createBanner, 500); });
            } else {
                setTimeout(createBanner, 500);
            }
        }
    } catch (e) {
        console.error('analytics-consent initialization error', e);
    }
})();
