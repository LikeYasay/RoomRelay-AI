api.controller = function ($scope, roomRelayApi) {
    var c = this;
    c.loading = true;
    c.error = '';
    c.overview = null;

    c.load = function () {
        c.loading = true;
        c.error = '';
        roomRelayApi.getOverview().then(
            function (overview) {
                c.overview = overview;
                c.loading = false;
            },
            function (err) {
                c.error = err.message;
                c.loading = false;
            }
        );
    };

    // Reload after a defect is reported from the Report a Defect widget on the same page.
    $scope.$on(roomRelayApi.refreshEvent, c.load);
    c.load();
};
