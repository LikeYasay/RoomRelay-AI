api.controller = function ($scope, roomRelayApi) {
    var c = this;
    c.limits = { titleMax: 100, descriptionMax: 1000 };
    c.loading = true;
    c.error = '';
    c.allowed = false;
    c.rooms = [];
    c.form = { roomId: '', title: '', description: '' };
    c.fieldErrors = {};
    c.saving = false;
    c.success = '';

    c.load = function () {
        c.loading = true;
        c.error = '';
        roomRelayApi.getOverview().then(
            function (overview) {
                c.allowed = overview.report.allowed;
                c.rooms = overview.report.rooms;
                c.loading = false;
            },
            function (err) {
                c.error = err.message;
                c.loading = false;
            }
        );
    };

    c.submit = function () {
        if (c.saving) return;
        c.saving = true;
        c.error = '';
        c.success = '';
        c.fieldErrors = {};
        var roomId = c.form.roomId;
        // The server checks everything again (role, room, lengths); nothing here is trusted.
        roomRelayApi.reportDefect(roomId, c.form.title, c.form.description).then(
            function () {
                c.saving = false;
                c.success = 'Defect reported for Room ' + roomId + '. A supervisor will assign a technician and set the priority.';
                c.form = { roomId: '', title: '', description: '' };
            },
            function (err) {
                c.saving = false;
                c.error = err.message;
                c.fieldErrors = err.fieldErrors;
            }
        );
    };

    c.load();
};
