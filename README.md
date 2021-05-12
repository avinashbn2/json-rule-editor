## json-rule-editor

### Getting Started

Json rule editor is an unornamented web interface tool to manage your business rules and decision outcomes. A single page application to effortlesly upload / create business rules via json files. Since the lightweight libraries are the new normal in web applications, possessing logics in json file will be a effective way to manage the application code. Having said that redudancy can be detoured by discarding the other business rule file format such as xml or excel, which is often hectic to parse and adding complications to developer.

Process to implement json rule file in your application follows

- Generate rule file using json rule editor
- Place the generated file in your application folder,
- and pass the relative path of file and input parameters into json rules engine to get the output.

Facinating feature it implies is, we can validate the business decisions instantly once after rules are added. Thus, ensuring expected outcome is returned from the rule sheet before generates the file. Consequently it eliminates issues at first place when rules are being created instead of identifing at later stage of development or testing.

### Usage:

To launch the json rule editor tool, you can do either of the below

1.                  Click [json rule editor](https://www.json-rule-editor.com)
2.  or install it locally via `git clone https://github.com/vinzdeveloper/json-rule-editor.git`
    - start the application by `npm install` and `npm start`

The detailed steps to create json rule file using this tool in [next section](https://vinzdeveloper.github.io/json-rule-editor/docs/create-rules.html).

### Thanks to json-rules-engine:

In principle, json rules engine is an integral backbone library should be added into your application to process the business rules created from this rule editor. It is highly recommended to go through the json rules engine concepts and explore the features it offers.

Install json rules engine in your application using the steps mentioned in the [npm](https://www.npmjs.com/package/json-rules-engine)

This documentation explains the steps to create / manage rules in json rule editor tool.

This documentation covers,

1. [Why Rule Engine?](https://vinzdeveloper.github.io/json-rule-editor/docs/rule-engine.html)
2. [Create Business Decisions using Json Rule Editor](https://vinzdeveloper.github.io/json-rule-editor/docs/create-rules.html)
3. [Implementation of rules in application](https://vinzdeveloper.github.io/json-rule-editor/docs/implementation.html)
4. [Manage existing rule](https://vinzdeveloper.github.io/json-rule-editor/docs/manage-rules.html)
5. [More examples in Decisions](https://vinzdeveloper.github.io/json-rule-editor/docs/decisions.html)
6. [Advanced examples](https://vinzdeveloper.github.io/json-rule-editor/docs/advanced.html)

# Project specific documentation

### Configuration

`/src/constants` includes json configuration of attributes, data-types, operators, options ( options for multivalued attributes) and yield types

`/reducers/ruleset-reducer/` includes the core actions for performing CRUD operations on rulesets

`/utils/` includes utitlity functions and helpers which are used for transformations

### Ruleset

`/src/containers/ruleset/ruleset-container.js` - Container component of all the tabs (Fields, Tests, Generate, Validate, Push )

for adding/updating/deleting rulesets redux actions are present in the `src/reducers/ruleset-reducer.js`

### Tests

`/src/components/test-runner/index.js` includes logic related to test runner
`/src/components/test-runner/test-cases.js` view for test cases

for adding/updating/deleting tests redux actions are present in the `src/reducers/testcase-reducer.js`

### Validations

`/src/components/validate/validate-rules.js`- includes the validation logic

`/src/validations/validate-rules.js`- includes functions for calling engine function which is used to get the success/failed test results

### Core Engine

`/src/engine` includes core lib functions which are used to create the facts, conditions, operators etc based on the configurations
any modification need for core logic changes needs to be done here
