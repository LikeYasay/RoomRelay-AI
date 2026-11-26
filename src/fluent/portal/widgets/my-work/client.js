api.controller = function ($scope, roomRelayApi) {
    var c = this;
    c.loading = true;
    c.error = '';
    c.work = null;

    c.load = function () {
        c.loading = true;
        c.error = '';
        roomRelayApi.getOverview().then(
            function (overview) {
                c.work = overview.myWork;
                c.loading = false;
            },
            function (err) {
                c.error = err.message;
                c.loading = false;
            }
        );
    };

    $scope.$on(roomRelayApi.refreshEvent, c.load);
    c.load();
};
