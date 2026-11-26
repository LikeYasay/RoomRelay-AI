/*
 * roomRelayApi: the one place the RoomRelay portal widgets call the server.
 * It uses the same Scripted REST API as the full app, so the same role checks (ACL),
 * per-role data scoping and readiness rules apply. The browser never sends a role.
 */
function roomRelayApi($http, $window, $rootScope) {
    var BASE = '/api/x_2318724_roomrela/v1/roomrelay';
    var REFRESH_EVENT = 'roomrelay.portal.refresh';

    function headers() {
        var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
        // ServiceNow's session token: protects the request against cross-site use.
        if ($window.g_ck) h['X-UserToken'] = $window.g_ck;
        return h;
    }

    // Scripted REST wraps every body in { result: ... }.
    function unwrap(response) {
        var body = response && response.data;
        return body && body.result !== undefined ? body.result : body;
    }

    // Only messages written by RoomRelay's own rules are shown; anything else gets a generic text.
    function toError(response) {
        var body = unwrap(response) || {};
        var error = body.error || {};
        var status = response ? response.status : 0;
        var known = { forbidden: 1, not_found: 1, invalid: 1, conflict: 1 };
        return {
            status: status,
            message:
                known[error.code] && typeof error.message === 'string'
                    ? error.message.slice(0, 300)
                    : status === 401
                      ? 'Your session has ended. Sign in again.'
                      : status === 403
                        ? 'Your account does not have access to RoomRelay.'
                        : 'RoomRelay could not be reached. Try again in a moment.',
            fieldErrors: error.fieldErrors || {}
        };
    }

    return {
        refreshEvent: REFRESH_EVENT,

        /** Readiness totals, blocked rooms, "my work" and the report room list for the signed-in user. */
        getOverview: function () {
            return $http.get(BASE + '/portal/overview', { headers: headers() }).then(unwrap, function (r) {
                throw toError(r);
            });
        },

        /** Reports a defect through the same rule the app uses (role, room and field checks on the server). */
        reportDefect: function (roomId, title, description) {
            var command = { type: 'defect.report', roomId: roomId, title: title, description: description };
            return $http.post(BASE + '/commands', command, { headers: headers() }).then(
                function () {
                    $rootScope.$broadcast(REFRESH_EVENT);
                },
                function (r) {
                    throw toError(r);
                }
            );
        }
    };
}
