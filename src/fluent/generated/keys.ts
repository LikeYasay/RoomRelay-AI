import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: 'ae76afb21c1544afa2ba2530de586fb4'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '9c6102d8f0c745428a1f93de71b273d1'
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '131e336df7e64557977ac8e53d0f6a42'
                        key: {
                            application_file: '206158fd6d0648e5a544b0a7871e9e59'
                            source_artifact: 'f6e36194baae4c48857f787be37aa306'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '206158fd6d0648e5a544b0a7871e9e59'
                        key: {
                            name: 'x_2305075_roomrela/main.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4b25287c997a4a1d8fcafcc0666ac7a3'
                        key: {
                            name: 'x_2305075_roomrela/main'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '5c2b875de38a4ac993b2364ef01b6690'
                        key: {
                            endpoint: 'x_2305075_roomrela_incident_manager.do'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '660c25651ebf43ac8daae399821ef792'
                        key: {
                            application_file: '5c2b875de38a4ac993b2364ef01b6690'
                            source_artifact: 'f6e36194baae4c48857f787be37aa306'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'd9aea9cde2cd4d279d58ea25eacd2050'
                        key: {
                            application_file: '4b25287c997a4a1d8fcafcc0666ac7a3'
                            source_artifact: 'f6e36194baae4c48857f787be37aa306'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'f6e36194baae4c48857f787be37aa306'
                        key: {
                            name: 'x_2305075_roomrela_incident_manager.do - BYOUI Files'
                        }
                    },
                ]
            }
        }
    }
}
