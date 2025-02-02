const test = require("ava");
const AjvCoverage = require("../../../../../../../utils/AjvCoverage");
const {_Validator: Validator} = require("../../../../../../../../lib/validation/validator");
const ValidationError = require("../../../../../../../../lib/validation/ValidationError");
const project = require("../../../../__helper__/project");

async function assertValidation(t, config, expectedErrors = undefined) {
	const validation = t.context.validator.validate({config, project: {id: "my-project"}});
	if (expectedErrors) {
		const validationError = await t.throwsAsync(validation, {
			instanceOf: ValidationError,
			name: "ValidationError"
		});
		validationError.errors.forEach((error) => {
			delete error.schemaPath;
			if (error.params && Array.isArray(error.params.errors)) {
				error.params.errors.forEach(($) => {
					delete $.schemaPath;
				});
			}
		});
		t.deepEqual(validationError.errors, expectedErrors);
	} else {
		await t.notThrowsAsync(validation);
	}
}

test.before((t) => {
	t.context.validator = new Validator();
	t.context.ajvCoverage = new AjvCoverage(t.context.validator.ajv, {
		includes: ["schema/specVersion/2.0/kind/project/library.json"]
	});
});

test.after.always((t) => {
	t.context.ajvCoverage.createReport("html", {dir: "coverage/ajv-project-library"});
	const thresholds = {
		statements: 80,
		branches: 75,
		functions: 100,
		lines: 80
	};
	t.context.ajvCoverage.verify(thresholds);
});

["2.5", "2.4", "2.3", "2.2", "2.1", "2.0"].forEach(function(specVersion) {
	test(`library (specVersion ${specVersion}): Valid configuration`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"kind": "project",
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"resources": {
				"configuration": {
					"propertiesFileSourceEncoding": "UTF-8",
					"paths": {
						"src": "src/main/uilib",
						"test": "src/test/uilib"
					}
				}
			},
			"builder": {
				"resources": {
					"excludes": [
						"/resources/some/project/name/test_results/**",
						"!/test-resources/some/project/name/demo-app/**"
					]
				},
				"bundles": [
					{
						"bundleDefinition": {
							"name": "sap-ui-custom.js",
							"defaultFileTypes": [
								".js"
							],
							"sections": [
								{
									"name": "my-raw-section",
									"mode": "raw",
									"filters": [
										"ui5loader-autoconfig.js"
									],
									"resolve": true,
									"resolveConditional": true,
									"renderer": true,
									"sort": true
								},
								{
									"mode": "provided",
									"filters": [
										"ui5loader-autoconfig.js"
									],
									"resolve": false,
									"resolveConditional": false,
									"renderer": false,
									"sort": false,
									"declareRawModules": true
								}
							]
						},
						"bundleOptions": {
							"optimize": true,
							"decorateBootstrapModule": true,
							"addTryCatchRestartWrapper": true,
							"usePredefineCalls": true
						}
					},
					{
						"bundleDefinition": {
							"name": "app.js",
							"defaultFileTypes": [
								".js"
							],
							"sections": [
								{
									"name": "some-app-preload",
									"mode": "preload",
									"filters": [
										"some/app/Component.js"
									],
									"resolve": true,
									"sort": true,
									"declareRawModules": false
								},
								{
									"mode": "require",
									"filters": [
										"ui5loader-autoconfig.js"
									],
									"resolve": true
								}
							]
						},
						"bundleOptions": {
							"optimize": true,
							"numberOfParts": 3
						}
					}
				],
				"componentPreload": {
					"paths": [
						"some/glob/**/pattern/Component.js",
						"some/other/glob/**/pattern/Component.js"
					],
					"namespaces": [
						"some/namespace",
						"some/other/namespace"
					]
				},
				"jsdoc": {
					"excludes": [
						"some/project/name/thirdparty/**"
					]
				},
				"customTasks": [
					{
						"name": "custom-task-1",
						"beforeTask": "replaceCopyright",
						"configuration": {
							"some-key": "some value"
						}
					},
					{
						"name": "custom-task-2",
						"afterTask": "custom-task-1",
						"configuration": {
							"color": "blue"
						}
					}
				]
			},
			"server": {
				"settings": {
					"httpPort": 1337,
					"httpsPort": 1443
				},
				"customMiddleware": [
					{
						"name": "myCustomMiddleware",
						"mountPath": "/myapp",
						"afterMiddleware": "compression",
						"configuration": {
							"debug": true
						}
					}
				]
			}
		});
	});

	test(`library (specVersion ${specVersion}): Invalid configuration`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"resources": {
				"configuration": {
					"propertiesFileSourceEncoding": "UTF8",
					"paths": {
						"src": {"path": "src"},
						"test": {"path": "test"},
						"webapp": "app"
					}
				}
			},
			"builder": {
				"resources": {
					"excludes": "/resources/some/project/name/test_results/**"
				},
				"bundles": [
					{
						"bundleDefinition": {
							"name": "sap-ui-custom.js",
							"defaultFileTypes": [
								".js"
							],
							"sections": [
								{
									"name": true,
									"mode": "raw",
									"filters": [
										"ui5loader-autoconfig.js"
									],
									"resolve": true,
									"sort": true,
									"declareModules": true
								}
							]
						},
						"bundleOptions": {
							"optimize": true
						}
					},
					{
						"bundleDefinition": {
							"defaultFileTypes": [
								".js", true
							],
							"sections": [
								{
									"filters": [
										"some/app/Component.js"
									],
									"resolve": true,
									"sort": true,
									"declareRawModules": []
								},
								{
									"mode": "provide",
									"filters": "*",
									"resolve": true
								}
							]
						},
						"bundleOptions": {
							"optimize": "true",
							"numberOfParts": "3",
							"notAllowed": true
						}
					}
				],
				"componentPreload": {
					"path": "some/invalid/path",
					"paths": "some/invalid/glob/**/pattern/Component.js",
					"namespaces": "some/invalid/namespace",
				},
				"jsdoc": {
					"excludes": "some/project/name/thirdparty/**"
				},
				"customTasks": [
					{
						"name": "custom-task-1",
						"beforeTask": "replaceCopyright",
						"afterTask": "replaceCopyright",
					},
					{
						"afterTask": "custom-task-1",
						"configuration": {
							"color": "blue"
						}
					},
					"my-task"
				]
			},
			"server": {
				"settings": {
					"httpPort": "1337",
					"httpsPort": "1443"
				}
			}
		}, [
			{
				dataPath: "/resources/configuration/propertiesFileSourceEncoding",
				keyword: "enum",
				message: "should be equal to one of the allowed values",
				params: {
					allowedValues: [
						"UTF-8",
						"ISO-8859-1",
					],
				}
			},
			{
				dataPath: "/resources/configuration/paths",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "webapp",
				}
			},
			{
				dataPath: "/resources/configuration/paths/src",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				}
			},
			{
				dataPath: "/resources/configuration/paths/test",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				}
			},
			{
				dataPath: "/builder/resources/excludes",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				}
			},
			{
				dataPath: "/builder/jsdoc/excludes",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				}
			},
			{
				dataPath: "/builder/bundles/0/bundleDefinition/sections/0",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "declareModules",
				}
			},
			{
				dataPath: "/builder/bundles/0/bundleDefinition/sections/0/name",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition",
				keyword: "required",
				message: "should have required property 'name'",
				params: {
					missingProperty: "name",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition/defaultFileTypes/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition/sections/0",
				keyword: "required",
				message: "should have required property 'mode'",
				params: {
					missingProperty: "mode",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition/sections/0/declareRawModules",
				keyword: "type",
				message: "should be boolean",
				params: {
					type: "boolean",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition/sections/1/mode",
				keyword: "enum",
				message: "should be equal to one of the allowed values",
				params: {
					allowedValues: ["2.5", "2.4"].includes(specVersion) ? [
						"raw",
						"preload",
						"require",
						"provided",
						"bundleInfo"
					] : [
						"raw",
						"preload",
						"require",
						"provided"
					]
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleDefinition/sections/1/filters",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleOptions",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "notAllowed",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleOptions/optimize",
				keyword: "type",
				message: "should be boolean",
				params: {
					type: "boolean",
				}
			},
			{
				dataPath: "/builder/bundles/1/bundleOptions/numberOfParts",
				keyword: "type",
				message: "should be number",
				params: {
					type: "number",
				}
			},
			{
				dataPath: "/builder/componentPreload",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "path",
				}
			},
			{
				dataPath: "/builder/componentPreload/paths",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				}
			},
			{
				dataPath: "/builder/componentPreload/namespaces",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				}
			},
			{
				dataPath: "/builder/customTasks/0",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "afterTask",
				}
			},
			{
				dataPath: "/builder/customTasks/0",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "beforeTask",
				}
			},
			{
				dataPath: "/builder/customTasks/1",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "afterTask",
				}
			},
			{
				dataPath: "/builder/customTasks/1",
				keyword: "required",
				message: "should have required property 'name'",
				params: {
					missingProperty: "name",
				}
			},
			{
				dataPath: "/builder/customTasks/1",
				keyword: "required",
				message: "should have required property 'beforeTask'",
				params: {
					missingProperty: "beforeTask",
				}
			},
			{
				dataPath: "/builder/customTasks/2",
				keyword: "type",
				message: "should be object",
				params: {
					type: "object",
				}
			},
			{
				dataPath: "/server/settings/httpPort",
				keyword: "type",
				message: "should be number",
				params: {
					type: "number",
				}
			},
			{
				dataPath: "/server/settings/httpsPort",
				keyword: "type",
				message: "should be number",
				params: {
					type: "number",
				}
			}
		]);
	});

	test(`library (specVersion ${specVersion}): Invalid builder configuration`, async (t) => {
		const config = {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				// cachebuster is only supported for type application
				"cachebuster": {
					"signatureType": "time"
				}
			}
		};
		await assertValidation(t, config, [{
			dataPath: "/builder",
			keyword: "additionalProperties",
			message: "should NOT have additional properties",
			params: {
				additionalProperty: "cachebuster"
			}
		}]);
	});
});

["2.2", "2.1", "2.0"].forEach(function(specVersion) {
	test(`Unsupported builder/libraryPreload configuration (specVersion ${specVersion})`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"libraryPreload": {}
			}
		}, [
			{
				dataPath: "/builder",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "libraryPreload",
				},
			},
		]);
	});
	test(`Unsupported builder/componentPreload/excludes configuration (specVersion ${specVersion})`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"componentPreload": {
					"excludes": [
						"some/excluded/files/**",
						"some/other/excluded/files/**"
					]
				}
			}
		}, [
			{
				dataPath: "/builder/componentPreload",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "excludes",
				},
			},
		]);
	});
});

["2.5", "2.4", "2.3"].forEach(function(specVersion) {
	test(`library (specVersion ${specVersion}): builder/libraryPreload/excludes`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"kind": "project",
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"libraryPreload": {
					"excludes": [
						"some/excluded/files/**",
						"some/other/excluded/files/**"
					]
				}
			}
		});
	});
	test(`Invalid builder/libraryPreload/excludes configuration (specVersion ${specVersion})`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"libraryPreload": {
					"excludes": "some/excluded/files/**"
				}
			}
		}, [
			{
				dataPath: "/builder/libraryPreload/excludes",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				},
			},
		]);
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"libraryPreload": {
					"excludes": [
						true,
						1,
						{}
					],
					"notAllowed": true
				}
			}
		}, [
			{
				dataPath: "/builder/libraryPreload",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "notAllowed",
				},
			},
			{
				dataPath: "/builder/libraryPreload/excludes/0",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/libraryPreload/excludes/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/libraryPreload/excludes/2",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
		]);
	});


	test(`library (specVersion ${specVersion}): builder/componentPreload/excludes`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"kind": "project",
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"componentPreload": {
					"excludes": [
						"some/excluded/files/**",
						"some/other/excluded/files/**"
					]
				}
			}
		});
	});
	test(`Invalid builder/componentPreload/excludes configuration (specVersion ${specVersion})`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"componentPreload": {
					"excludes": "some/excluded/files/**"
				}
			}
		}, [
			{
				dataPath: "/builder/componentPreload/excludes",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				},
			},
		]);
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"componentPreload": {
					"excludes": [
						true,
						1,
						{}
					],
					"notAllowed": true
				}
			}
		}, [
			{
				dataPath: "/builder/componentPreload",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "notAllowed",
				},
			},
			{
				dataPath: "/builder/componentPreload/excludes/0",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/componentPreload/excludes/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/componentPreload/excludes/2",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
		]);
	});
});

["2.5", "2.4"].forEach(function(specVersion) {
	// Unsupported cases for older spec-versions already tested via "allowedValues" comparison above
	test(`library (specVersion ${specVersion}): builder/bundles/bundleDefinition/sections/mode: bundleInfo`,
		async (t) => {
			await assertValidation(t, {
				"specVersion": specVersion,
				"kind": "project",
				"type": "library",
				"metadata": {
					"name": "com.sap.ui5.test",
					"copyright": "yes"
				},
				"builder": {
					"bundles": [{
						"bundleDefinition": {
							"name": "my-bundle.js",
							"sections": [{
								"name": "my-bundle-info",
								"mode": "bundleInfo",
								"filters": []
							}]
						}
					}]
				}
			});
		});
});

["2.5"].forEach(function(specVersion) {
	test(`library (specVersion ${specVersion}): builder/settings/includeDependency*`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"kind": "project",
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"settings": {
					"includeDependency": [
						"sap.a",
						"sap.b"
					],
					"includeDependencyRegExp": [
						".ui.[a-z]+",
						"^sap.[mf]$"
					],
					"includeDependencyTree": [
						"sap.c",
						"sap.d"
					]
				}
			}
		});
	});
	test(`Invalid builder/settings/includeDependency* configuration (specVersion ${specVersion})`, async (t) => {
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"settings": {
					"includeDependency": "a",
					"includeDependencyRegExp": "b",
					"includeDependencyTree": "c"
				}
			}
		}, [
			{
				dataPath: "/builder/settings/includeDependency",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyRegExp",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyTree",
				keyword: "type",
				message: "should be array",
				params: {
					type: "array",
				},
			},
		]);
		await assertValidation(t, {
			"specVersion": specVersion,
			"type": "library",
			"metadata": {
				"name": "com.sap.ui5.test",
				"copyright": "yes"
			},
			"builder": {
				"settings": {
					"includeDependency": [
						true,
						1,
						{}
					],
					"includeDependencyRegExp": [
						true,
						1,
						{}
					],
					"includeDependencyTree": [
						true,
						1,
						{}
					],
					"notAllowed": true
				}
			}
		}, [
			{
				dataPath: "/builder/settings",
				keyword: "additionalProperties",
				message: "should NOT have additional properties",
				params: {
					additionalProperty: "notAllowed",
				},
			},
			{
				dataPath: "/builder/settings/includeDependency/0",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependency/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependency/2",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyRegExp/0",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyRegExp/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyRegExp/2",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyTree/0",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyTree/1",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
			{
				dataPath: "/builder/settings/includeDependencyTree/2",
				keyword: "type",
				message: "should be string",
				params: {
					type: "string",
				},
			},
		]);
	});
});

project.defineTests(test, assertValidation, "library");
