import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'audit-read-acl': {
                        table: 'sys_security_acl'
                        id: 'db402b3227a64db7ba015be3e5113caf'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'ae76afb21c1544afa2ba2530de586fb4'
                    }
                    'defect-read-acl': {
                        table: 'sys_security_acl'
                        id: '37225385975643a6b1e796f668a02d15'
                    }
                    'demo-role-a1': {
                        table: 'sys_user_has_role'
                        id: 'dfe93856eb8448b89592015f9387f6d3'
                    }
                    'demo-role-h1': {
                        table: 'sys_user_has_role'
                        id: '0921c8e48664413bbc10e7cf9029e700'
                    }
                    'demo-role-h2': {
                        table: 'sys_user_has_role'
                        id: '79e06ef167bb4275a6ceec0877226859'
                    }
                    'demo-role-h3': {
                        table: 'sys_user_has_role'
                        id: '883cad9ad0034b5ea4f38b3a93c3d8b7'
                    }
                    'demo-role-h4': {
                        table: 'sys_user_has_role'
                        id: 'e84ff4f3d3c5491494a257bb30c3872c'
                    }
                    'demo-role-h5': {
                        table: 'sys_user_has_role'
                        id: '07e01bd3344b4e818382fa3ed8b26494'
                    }
                    'demo-role-m1': {
                        table: 'sys_user_has_role'
                        id: '7c84456af2884001b34ca3915784341a'
                    }
                    'demo-role-m2': {
                        table: 'sys_user_has_role'
                        id: 'bf9fe434084d405eb815463e4c03efbf'
                    }
                    'demo-role-s1': {
                        table: 'sys_user_has_role'
                        id: '0359ae2d3001402cab4dfdc75b1bfa92'
                    }
                    'demo-staff-a1': {
                        table: 'x_2305075_roomrela_staff'
                        id: '57e9b6e1817f44c8a6299313734eb2af'
                    }
                    'demo-staff-h1': {
                        table: 'x_2305075_roomrela_staff'
                        id: 'a9fafc873ec84c699a69ee5d54a7b75b'
                    }
                    'demo-staff-h2': {
                        table: 'x_2305075_roomrela_staff'
                        id: '0c9a55628a1e4b99b8bac70664846f9f'
                    }
                    'demo-staff-h3': {
                        table: 'x_2305075_roomrela_staff'
                        id: 'aabf19b08fbf4cbdbe3c589146bfb05d'
                    }
                    'demo-staff-h4': {
                        table: 'x_2305075_roomrela_staff'
                        id: 'ac1c57e9c415484da4b676955084074a'
                    }
                    'demo-staff-h5': {
                        table: 'x_2305075_roomrela_staff'
                        id: '991848e186fe4b6bb3ec434d99da29f5'
                    }
                    'demo-staff-m1': {
                        table: 'x_2305075_roomrela_staff'
                        id: '35e26c4913ac48aabe17837b6b1e8ca0'
                    }
                    'demo-staff-m2': {
                        table: 'x_2305075_roomrela_staff'
                        id: 'f35e9ee48e5b4089b1fa05be8b6dacb5'
                    }
                    'demo-staff-s1': {
                        table: 'x_2305075_roomrela_staff'
                        id: '8414176249794c29b36f1f6b35bb58ef'
                    }
                    'demo-user-a1': {
                        table: 'sys_user'
                        id: 'b15327bd5a834c918d03c0d0103ba378'
                    }
                    'demo-user-h1': {
                        table: 'sys_user'
                        id: 'f327db3b8dcc47a3847e72badb5b6bcd'
                    }
                    'demo-user-h2': {
                        table: 'sys_user'
                        id: '88a4f5104bdd43baab9e0bef4917cd95'
                    }
                    'demo-user-h3': {
                        table: 'sys_user'
                        id: 'fd480e7583d643f78a8ae51f52d0a38d'
                    }
                    'demo-user-h4': {
                        table: 'sys_user'
                        id: 'c23daf303f934233986a4d91ea3102c9'
                    }
                    'demo-user-h5': {
                        table: 'sys_user'
                        id: '5fce2551ed4c4733a7619854b1d77c61'
                    }
                    'demo-user-m1': {
                        table: 'sys_user'
                        id: '4a08878bf1054a3b91bc4bc19c61c001'
                    }
                    'demo-user-m2': {
                        table: 'sys_user'
                        id: '11475f0ef38447ce871ed6cb8c11ad09'
                    }
                    'demo-user-s1': {
                        table: 'sys_user'
                        id: 'd45d3ab4068b4c608cbdbe7668c1bde2'
                    }
                    'groq-header-accept': {
                        table: 'sys_rest_message_headers'
                        id: '8297cb80d8b544a5a92ef515eba255e6'
                    }
                    'groq-header-content-type': {
                        table: 'sys_rest_message_headers'
                        id: '7ca50fc8d6ef4f3682b030f60f2c59a1'
                    }
                    'groq-rest-message': {
                        table: 'sys_rest_message'
                        id: '188a644109b845df91d4fb989437cf86'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '9c6102d8f0c745428a1f93de71b273d1'
                    }
                    'room-read-acl': {
                        table: 'sys_security_acl'
                        id: '32a755d0ab154a5cba30c3b1748039b8'
                    }
                    'roomrelay-api': {
                        table: 'sys_ws_definition'
                        id: '0a4c3c32d4e444588929826fefa672bc'
                    }
                    'roomrelay-api-acl': {
                        table: 'sys_security_acl'
                        id: '5816948b3c33406d8f341e0d034b9932'
                    }
                    'roomrelay-api-v1': {
                        table: 'sys_ws_version'
                        id: 'c4e29d5b764b45d3abb5b88297495e43'
                    }
                    'roomrelay-get-me': {
                        table: 'sys_ws_operation'
                        id: '44130e4e549f4ddba7ab96fbd8e49c8c'
                    }
                    'roomrelay-get-snapshot': {
                        table: 'sys_ws_operation'
                        id: '2ca821d641e74af5834a363d554776ff'
                    }
                    'roomrelay-menu': {
                        table: 'sys_app_application'
                        id: '6dcc8fdaaad049d18eb66f3c6b6689bd'
                    }
                    'roomrelay-module-open': {
                        table: 'sys_app_module'
                        id: '26c02f6b4bdb442886b73c003e34488d'
                    }
                    'roomrelay-module-staff': {
                        table: 'sys_app_module'
                        id: '1bd9cb523cd6453783e3804a63b330c7'
                    }
                    'roomrelay-post-briefing': {
                        table: 'sys_ws_operation'
                        id: 'afbe4390624642f7bdb80180c12a364a'
                    }
                    'roomrelay-post-commands': {
                        table: 'sys_ws_operation'
                        id: '617eeaf2d0a843398d0ab4212edbb407'
                    }
                    'roomrelay-post-demo-reset': {
                        table: 'sys_ws_operation'
                        id: 'e96e7a342cb44dcc81fd6fc981e7d78b'
                    }
                    src_client_app_applyCommand_ts: {
                        table: 'sys_module'
                        id: 'e7ef622482ac492fa491709f05d415ee'
                    }
                    src_client_features_access_permissions_ts: {
                        table: 'sys_module'
                        id: '78050a5343be4f4c9b0733bd608f310a'
                    }
                    src_client_features_activity_recentActivity_ts: {
                        table: 'sys_module'
                        id: '981eb5d5f77c46d09525c1b44f6afb54'
                    }
                    src_client_features_auth_accountRequestValidation_ts: {
                        table: 'sys_module'
                        id: '60028e9b5f8b4fcebf5860141fb90acc'
                        deleted: true
                    }
                    src_client_features_dashboard_dashboardStats_ts: {
                        table: 'sys_module'
                        id: '8d8fda92a94a4010bb075f2ab626bc85'
                    }
                    src_client_features_handoff_aiBriefing_ts: {
                        table: 'sys_module'
                        id: 'ce227e5b99894422a250be24b6def4cb'
                    }
                    src_client_features_handoff_briefing_ts: {
                        table: 'sys_module'
                        id: 'e3e313d3d38946a2bf0f513eeb69a733'
                    }
                    src_client_features_handoff_handoffCommands_ts: {
                        table: 'sys_module'
                        id: '357f7edcb2fc448eaeeb13e4a348487f'
                    }
                    src_client_features_housekeeping_taskCommands_ts: {
                        table: 'sys_module'
                        id: '66bb1d8d562e46ba9aab8b0adac8c4e5'
                    }
                    src_client_features_housekeeping_taskValidation_ts: {
                        table: 'sys_module'
                        id: 'ff62b20f4d3148ed8e240b3803803e65'
                    }
                    src_client_features_maintenance_blockers_ts: {
                        table: 'sys_module'
                        id: '4dee8d033478455c818d6b6b18a38afe'
                    }
                    src_client_features_maintenance_defectCommands_ts: {
                        table: 'sys_module'
                        id: 'e26ab1414ed94d89a3cce2da2d70fba2'
                    }
                    src_client_features_maintenance_defectValidation_ts: {
                        table: 'sys_module'
                        id: '5e382e3739134be7b96c968d6f0350ba'
                    }
                    src_client_features_maintenance_scope_ts: {
                        table: 'sys_module'
                        id: '19402ca6ff134128abef7b3b3392e3d5'
                    }
                    src_client_features_rooms_progress_ts: {
                        table: 'sys_module'
                        id: '2cdc7c063b6b4a6fab8964ba5d6ec1ab'
                    }
                    src_client_features_rooms_readiness_ts: {
                        table: 'sys_module'
                        id: '56172bb28bd1428495ba37419a9dda99'
                    }
                    src_client_features_rooms_roomActions_ts: {
                        table: 'sys_module'
                        id: 'eb563a2cc02f4d849212ed42d4506bc8'
                    }
                    src_client_features_rooms_roomCommands_ts: {
                        table: 'sys_module'
                        id: 'cb6c957526854c35916189210ae676ec'
                    }
                    src_client_features_rooms_roomViews_ts: {
                        table: 'sys_module'
                        id: '227b3711f0d149048017927a6b525a05'
                    }
                    src_client_features_rooms_scope_ts: {
                        table: 'sys_module'
                        id: '81dcd9e34d5e4c8795aaa40fc83ea3d8'
                    }
                    src_client_mock_mockData_ts: {
                        table: 'sys_module'
                        id: 'e58df837ddc344ef8bb0a7157c18b6e1'
                    }
                    src_client_shared_api_commands_ts: {
                        table: 'sys_module'
                        id: '08e8fe34e2e6494e8f9edfe0c2f7ec84'
                    }
                    src_client_shared_api_dataSource_ts: {
                        table: 'sys_module'
                        id: '654f0dccec0d4c0d9b40474d95b7c04e'
                    }
                    src_client_shared_domain_commandKit_ts: {
                        table: 'sys_module'
                        id: '0b211b993c014f688414098d7fd37a4c'
                    }
                    src_client_shared_domain_labels_ts: {
                        table: 'sys_module'
                        id: '386a4d790a344d4f8a6f6822ed6fb89a'
                    }
                    src_client_shared_domain_types_ts: {
                        table: 'sys_module'
                        id: '3d339eee4aef4414bba2284babc85da4'
                    }
                    src_client_shared_lib_format_ts: {
                        table: 'sys_module'
                        id: '87b366008b0d4ef382d0af81818174c8'
                    }
                    src_client_shared_lib_validation_ts: {
                        table: 'sys_module'
                        id: 'ab5ab5d36e914d4bac2c2be9452dde80'
                    }
                    src_client_shared_ui_iconPaths_ts: {
                        table: 'sys_module'
                        id: 'd7f62bad61a248ee95870165b7eb5c02'
                    }
                    src_client_shared_ui_tone_ts: {
                        table: 'sys_module'
                        id: '00e28c9b62864aeba20fc8fe408f4058'
                    }
                    src_server_api_handlers_ts: {
                        table: 'sys_module'
                        id: 'a668fd87b01f452ea6f17c28a0627758'
                    }
                    src_server_data_demoData_ts: {
                        table: 'sys_module'
                        id: '7d84675d686a4259a21efe6d56247761'
                    }
                    src_server_data_repository_ts: {
                        table: 'sys_module'
                        id: 'cf585eaed93e4a12ba057023ed0e25c3'
                    }
                    src_server_handoff_briefingHandler_ts: {
                        table: 'sys_module'
                        id: '86c7412be57843cf9e1925b93ed39784'
                    }
                    src_server_handoff_groq_ts: {
                        table: 'sys_module'
                        id: 'cc76a926ebb1401fa7ee3ff19ad726bf'
                    }
                    src_server_shared_http_ts: {
                        table: 'sys_module'
                        id: '2b18f833d6754c6f9116957d6525188e'
                    }
                    src_server_shared_session_ts: {
                        table: 'sys_module'
                        id: '411f14f0b35e4771af8f5a4a4cc6c143'
                    }
                    src_server_shared_tables_ts: {
                        table: 'sys_module'
                        id: 'be6d1cd7a9a647b49fbeb605b7399eaa'
                    }
                    src_server_shared_time_ts: {
                        table: 'sys_module'
                        id: '2fd611ede61e47eca2a74c3cfbe87616'
                    }
                    'staff-create-acl': {
                        table: 'sys_security_acl'
                        id: '43d93a1e60224083934f5c97c737332f'
                    }
                    'staff-read-acl': {
                        table: 'sys_security_acl'
                        id: '87a13df750b645378aea61d5e453da24'
                    }
                    'staff-write-acl': {
                        table: 'sys_security_acl'
                        id: 'bba628b394f94f9eb8f3039d6afb60b9'
                    }
                    'styles/fonts.css': {
                        table: 'sys_ux_theme_asset'
                        id: '3647d5063bc248bfb11a629d66825357'
                        deleted: true
                    }
                    'styles\\fonts.css': {
                        table: 'sys_ux_theme_asset'
                        id: '5f6bc4d9381c48ee86a7c25637a043f9'
                        deleted: true
                    }
                    'task-read-acl': {
                        table: 'sys_security_acl'
                        id: 'f9e7d7fc8cc7425587ae0829b2b41328'
                    }
                    'xs-read-sys-user': {
                        table: 'sys_scope_privilege'
                        id: '4bb2f1fb4342437eb40e8ff2a0180476'
                    }
                    'xs-read-sys-user-has-role': {
                        table: 'sys_scope_privilege'
                        id: '2ef923e90b2e4605850b6482598cede9'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '02e2c6b161ac4a208df92ce1fab029df'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '02e691329a734c0babe0e57377e8450d'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'room'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '042cd0d8486b46a7ade172330bde2252'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '084ef853f871447db75d2951f311e433'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'assigned_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '08bb9c0f4a2645f8bb36f37de5fe2bf2'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '08e896cdddf949a89b4bee2e1e0801ac'
                        key: {
                            name: 'x_2305075_roomrela_task'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0c5d94904369432abf1923531b5dd7b4'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d09713116ea4f8485994b26ebfa8cb4'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'room'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0f25aec4eba54a17bbba89717555e9d7'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '10a9fff6b4e544caa57ec01a524a2e78'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'room_type'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '131e336df7e64557977ac8e53d0f6a42'
                        key: {
                            application_file: '206158fd6d0648e5a544b0a7871e9e59'
                            source_artifact: 'f6e36194baae4c48857f787be37aa306'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '14c735baaeb4449fb97fb288dcb7db21'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'summary'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '186e008fcc9b48a180cfbed64e191cfa'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'assigned_at'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '18cb3e6636dd4b6ea7bf0e452e2c570d'
                        key: {
                            sys_security_acl: '37225385975643a6b1e796f668a02d15'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c7c1d7b50db47d38dffe51976cdb2fc'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1d0ce8bdd52c4d2cb8ac58919c543c3f'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
                            value: 'blocking'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d30b32277144fc79218cc8f5a2cb468'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
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
                        table: 'sys_choice'
                        id: '252961c9a3f94959a276d87526c47dd3'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                            value: 'supplies_missing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '272d673bfac9449bb9c267f633df41b2'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'completed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '27b32fe3e1fc4519b6ad2d427f4ff149'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2a0c6d8286a246de92e5cde297118060'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'code'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2b3899ceded249038c6e72b4981588a9'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'mandatory'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2bc854d0cd6f40229204cb55dd1c6bf5'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2d5e26be12f8438bac16c061e866e8b6'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'technician'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '30597c6b2e2049cabfc19e1e581f081e'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'target'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '30b0c39c855b4eebb96b68301925a78a'
                        key: {
                            sys_security_acl: 'db402b3227a64db7ba015be3e5113caf'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3335bc9bf6f840ffa2758c221a8a438c'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'demo_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '345f6589203248a6821406c914d982a5'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '35d2fede221141649bec476328c4328e'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '36c3d75372b04b1398c2dc308571f51c'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'actor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3919c691633144ccaf7e1ef3b97252d0'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3966da96f67c445dad30aefd2209ffa5'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                            value: 'night'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '3b52b637bd9048d5a68ab3942a5adc03'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3c9e453ad1804389b9c83b2440238a69'
                        key: {
                            sys_security_acl: '5816948b3c33406d8f341e0d034b9932'
                            sys_user_role: {
                                id: '86a9aec05d6d4967966fc2f62e8537a8'
                                key: {
                                    name: 'x_2305075_roomrela.supervisor'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_rest_message_fn'
                        id: '3cc20052c8cf446aad77345280d35895'
                        key: {
                            rest_message: '188a644109b845df91d4fb989437cf86'
                            function_name: 'chat completions'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3dbb2d70a54d4ee28e1304435a1acf9e'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'mandatory'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3ddebdf6af6a43ad9bed565f2816b4f4'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3e02cb9fcb944a22b4169c42f45c6153'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'reported_at'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3eee1c0ae2794bc39769c969f48ac4c5'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '448dab3c406d4a53a94afbd108b594ff'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'room'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '44cf8a55cf954ffaa8c361c30f3404d6'
                        key: {
                            name: 'x_2305075_roomrela_room'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '474bc04575094f839c5ad484b0c40995'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
                            language: 'en'
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
                        table: 'sys_dictionary'
                        id: '4b7d1d986c7c41d5b6a2414f43e0ef4b'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'assigned_to'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4c310c0805dc445b935d18291c04e7c0'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'source_task'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '4d2e17cd78e74704831720d28ecbc0b1'
                        key: {
                            name: 'x_2305075_roomrela_task'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4dd1a8f51e0d4bcb85323e79f3dafc9b'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '50d1e81825e640cb95b454e7bc2cdbac'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '51a50485a20f4d2d894ac50792647866'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'linked_defect'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '51daf44774754abf9c30a7873fbfe2fc'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5222906ab3254bc8bdb86a53c3e3c596'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                            value: 'morning'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '59d675f22f9d4755a665644be0a24d93'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'description'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '5a8aadfdbb764acf9468d48685535c43'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5b9ddd30779449ae9d1a1b50d733a992'
                        key: {
                            sys_security_acl: 'bba628b394f94f9eb8f3039d6afb60b9'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5c1a07501d3c45d9b9e2772ba94cc765'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'user'
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
                        table: 'sys_documentation'
                        id: '5cddfc856da34784b477e22c30eb546a'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5d665c12fe0b46d0a6312441e885219b'
                        key: {
                            sys_security_acl: '43d93a1e60224083934f5c97c737332f'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5f36786008004394a8b0048128bb5e9f'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                            value: 'resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '60773c104c8b45a18bf881aa9eb7c801'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6237f6ccc16249ca9414b8167f681c50'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'summary'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '62a2aff42de94fa5961ff9df01d971f3'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '62d0c0f5aeff4b2cab20b59b62519aec'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                            value: 'new'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '65e0cd4295e74c71b53d67976eb8db77'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'title'
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
                        table: 'sys_choice_set'
                        id: '66c0a9710a684f1983b68452cca50228'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '66f4cccce60d4d73882d4ac37ed45672'
                        key: {
                            name: 'x_2305075_roomrela.app_admin'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '67e3c05495854c9e91264c1e8c2d1188'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'title'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6a5f4ec92b5d4747a28eac4b07506161'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'repair_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6c3b0272e5624e20a5da83d59f7d2776'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'demo_key'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '70696a2bb0b84e769c572f270c2e0417'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '717dd773acca4d3689106844199d9e98'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
                            value: 'minor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7206ca15082243d38a75efc5bb256bce'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'room'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '77693e16296e4f5b8a1317aaeaa13d7b'
                        key: {
                            name: 'x_2305075_roomrela.maintenance'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '78309111bd7c46419d6882f1eb79d0f6'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
                            value: 'normal'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '78653e45aa9a4274a63580c4238ef1d0'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'assigned_to'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7911f81094d0443c8d120a1c70842ac7'
                        key: {
                            sys_security_acl: '87a13df750b645378aea61d5e453da24'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7e7b469e5fb34255b8a4690d33226cac'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'title'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8033f7cef81a44ceba5bffaea30526a1'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                            value: 'not_requested'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '81bb1697dbb745c08616effd18578f1f'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'started_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '824bbedd37694408a4d8945d80beca13'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'number'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '83d7a236081e4fa7b1c929cad29c5287'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'resolution_notes'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '855b1aec0203405796d52e11b51f8a25'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'assigned_by'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '86a9aec05d6d4967966fc2f62e8537a8'
                        key: {
                            name: 'x_2305075_roomrela.supervisor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '870abbdffcfe4466929490ad7646724d'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'floor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8a033ecac88c40ed84e0105834c345ae'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'floor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8bce58740bdd425e954e3230f75c3d6f'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '90854b651e544c2991649862a2fae265'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '90ab8fa7132540d9b2ff032e723b2dbc'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '910e316241fa4ba78b4d1474323ed91d'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '91a567d93a1146bda0e19a7f9d148ac5'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'reported_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '93bc7f270e214bd89dd3a22bfb5883f0'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '94bb134de4fd4178af9a18cac2c576e4'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '96e3485503054c3f8f733e4b69f8bb7c'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '971f0db09bd44b26be99e93037742899'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'started_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '985db39e3a64475582d478297898ba51'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                            value: 'assigned'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '98faf2b43d004e70af35db0ac4019461'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9a6112fe34a04f75a632793bad821a44'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'priority'
                            value: 'normal'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9ab2d4829924457597240c55f2673578'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'actor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9d281185e5744e4f841ec34655314737'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'reported_by'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '9d74c151247c497ca7eefa4093240b0f'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a052e7addc094943b87559dd12cb925d'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'resolved_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a14770eec3c944499d9cf4e4bead16e2'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a4f74093b595466f9ae5839edb3bedce'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'technician'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a90fcf529eef4825809ea438f06c8648'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                            value: 'completed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b11c4900f0cd40ce9bd80a34538e1d89'
                        key: {
                            sys_security_acl: '5816948b3c33406d8f341e0d034b9932'
                            sys_user_role: {
                                id: '77693e16296e4f5b8a1317aaeaa13d7b'
                                key: {
                                    name: 'x_2305075_roomrela.maintenance'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b1c0f4100f68473eb4a9101f721d1c0b'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b360310c95574498ae19ba8062683914'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'source_task'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b44af9764dd4498d888b31c623229ffc'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'resolved_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b6aab94fbcfb4877a6c874d7bd79709e'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7850450bf8a4176ac406dcfef8e5b5c'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b8093df8d217459c938fe4a0b998ce07'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'completed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b86d016c71d847fbab9e3a1bc0b75f0a'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'b9ed6f703f994aec96aa08783f425ce8'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bd2fdff2fb924168ae72efeeaba00fd1'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c1611a7ffccf4cca9b25909a6379f001'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c2f75bfe91944e04a474f7e38885b9f5'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'action'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c33f1222a14c4fc3b7336f220e7ced8f'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c4f07c837a8540c69768a2cb88169468'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                            value: 'needs_maintenance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c63f9badf34c4448b4e12d72e419c787'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c6a219dc186d4acb95b5f9e66a1681ec'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'room_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c6ad622c3a8f44bfb044ffe16b36a4cb'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'assigned_to'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'c6e5c966c2044987a5dd21d4cb91b21b'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c87c0e200b7d4b0b8d50c1541c069b42'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'c9c1e7913dfb426d8a3646e814fa8296'
                        key: {
                            name: 'x_2305075_roomrela_room'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cca5f365b9eb4a9fbba36ac824eff441'
                        key: {
                            sys_security_acl: 'f9e7d7fc8cc7425587ae0829b2b41328'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd8d0945be154fecbbc5601276e34251'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cf3a55b6b1394b838b60bb8cb95549f1'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'status'
                            value: 'couldnt_complete'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cf68247f3c0841169c71cd11659e8862'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_reason'
                            value: 'other'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cf7aae7043704b99a892515a251cc339'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'incomplete_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd0a69cda9a614750885310101d1cf8fc'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'action'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd0e9bbcab27445b6be8dc287549d625e'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd2565ce2bfde4760a6bd97172b6b46a5'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd73391bfe80841cd86211b5ac0921c81'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'code'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'd8bc9b0ed92f4ad7ae377fd69a9804e4'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
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
                        table: 'sys_dictionary'
                        id: 'dad30ef33da34b438df37a121a1d2ee3'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'target'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'db162500daec4c3ca851a11013627169'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ddfafb74a8964099be630a1da5d3a96d'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'linked_defect'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'de213729adba443e9b74d78257a4b56b'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'repair_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df49625eb008466880e00d75e47673fe'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                            value: 'afternoon'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e0c757cfcdad49bf8d0d570005cfe6a7'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'shift'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e29603206bf04655931cf5b0474eb26d'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'assigned_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e2e74e8d9dbd49c4a5c58f42bd663cf3'
                        key: {
                            name: 'x_2305075_roomrela_staff'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e4435bd087d9401bbe5071aee05df89f'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e775c70c94614ff1aa7be330a3e7d269'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'assigned_to'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e795b2c770174236968bf1568d7dbcac'
                        key: {
                            sys_security_acl: '5816948b3c33406d8f341e0d034b9932'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eac135ded0964940a5a91ba2eda00a07'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'resolution_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ec810cc2b739483c992bd61407b61e3e'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
                            value: 'low'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eecc6e48bc0c4aecba716a2f92e67631'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'title'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'eee4b3edfd7947a7b1e35bd0ec2d3b53'
                        key: {
                            name: 'x_2305075_roomrela.housekeeper'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f0587ff1e4a6486983f0936efb102aa1'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'room'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f0af77f0f6eb48e4a6650e2fb4b9e91a'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'reported_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f25a3ae0924442cca247a5aa4bc07df1'
                        key: {
                            name: 'x_2305075_roomrela_task'
                            element: 'priority'
                            value: 'high'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f4cc153449d140b4945e5faf5dfac6e3'
                        key: {
                            sys_security_acl: '32a755d0ab154a5cba30c3b1748039b8'
                            sys_user_role: {
                                id: '66f4cccce60d4d73882d4ac37ed45672'
                                key: {
                                    name: 'x_2305075_roomrela.app_admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f5398c85207f419c920438ac15df622e'
                        key: {
                            name: 'x_2305075_roomrela_audit'
                            element: 'room'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f55b5bf915e94bfea4ac4800d3272e1a'
                        key: {
                            sys_security_acl: '5816948b3c33406d8f341e0d034b9932'
                            sys_user_role: {
                                id: 'eee4b3edfd7947a7b1e35bd0ec2d3b53'
                                key: {
                                    name: 'x_2305075_roomrela.housekeeper'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'f6e36194baae4c48857f787be37aa306'
                        key: {
                            name: 'x_2305075_roomrela_incident_manager.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f86ff7bff1ae40b8a22ab27603f02d6d'
                        key: {
                            name: 'x_2305075_roomrela_defect'
                            element: 'status'
                            value: 'in_progress'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f8c29a44beab4b0292f3b3a462f7cf4b'
                        key: {
                            name: 'x_2305075_roomrela_room'
                            element: 'inspection'
                            value: 'passed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                ]
            }
        }
    }
}
