/* eslint-disable no-undef */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import PageTitle from "../../components/title/page-title";
import Tabs from "../../components/tabs/tabs";
import Attributes from "../../components/attributes/attributes";
import Decisions from "../../components/decisions/decision";
import ValidateRules from "../../components/validate/validate-rules";
import { handleAttribute } from "../../actions/attributes";
import Button from "../../components/button/button";
import DiffRenderer from "../../components/diff-renderer";
import Modal from "react-modal";
import {
  handleDecision,
  addRulesetData,
  changeRulecaseOrder,
  addNewItem,
} from "../../actions/decisions";
import InputField from "../../components/forms/input-field";

import { updateRulesetName } from "../../actions/ruleset";
import Banner from "../../components/panel/banner";
import * as Message from "../../constants/messages";
import { groupBy } from "lodash/collection";
import RuleErrorBoundary from "../../components/error/ruleset-error";
import SweetAlert from "react-bootstrap-sweetalert";
import attributes from "../../constants/attributes.json";
import {
  getSha,
  getBranchSha,
  createPR,
  createBranch,
  mergePR,
  createBlob,
  createTree,
  createCommit,
} from "../../api";
import { PREFERENCE_PATH } from "../../constants/paths.json";
import Loader from "../../components/loader/loader";

Modal.setAppElement("#root");
const operatorsMap = {
  equal: "==",
  notEqual: "not_in",
  lessThanInclusive: "<=",
  lessThan: "<",
  greaterThan: ">",
  greaterThanInclusive: ">=",
  notIn: "not_in",
};
const tabs = [
  { name: "Fields" },
  { name: "Rulesets" },
  { name: "Validate" },
  { name: "Generate" },
  { name: "Push" },
];
const opMap = {
  "==": "in",
  "!=": "not_in",
};
const revOpMap = {
  in: "==",
  not_in: "not_in",
};
// const arrOps = ['in', 'not_in'];
const getActualOperator = ({ operator, value, nullable }) => {
  // console.log('operator, value, nullable', operator, value, nullable);
  if (value && typeof value === "string" && value.includes(",")) {
    // console.log('operator, value', operator, value);
    return opMap[operator] || operator;
  }
  // return revOpMap[operator] || operator;
  if (nullable && value !== "null" && value !== null) {
    return opMap[operator] || operator;
  }
  return revOpMap[operator] || operator;
};
const getArray = (val, op) => {
  if (op === "not_in") {
    return [val];
  }
  return val;
};
const getFormattedValue = (
  value,
  { type, fieldType } = {},
  nullable,
  operator
) => {
  switch (type) {
    case "string":
      if (value === "null") {
        return null;
      }
      if (value && value.includes(",")) {
        const arr = value && value.split(",").map((v) => (!v ? null : v));
        if (nullable) {
          arr.push(null);
          return arr;
        } else {
          return arr;
        }
      }
      return value
        ? nullable
          ? [value, null]
          : getArray(value, operator)
        : getArray(null, operator);
    // if (value.includes(',')) {
    // 	return value && value.split(',').map((v) => (!v ? null : v));
    // }

    case "boolean":
      if (value && typeof value === "string" && value.includes(",")) {
        const arr =
          value &&
          value.split(",").map((v) => (v === null ? null : v === "true"));
        return arr;
      }
      if (nullable && value && typeof value === "string") {
        return [null, value === "true"];
      } else if (nullable) {
        return getArray(null, operator);
      }

      return getArray(value === "true", operator);
    case "number":
      if (fieldType === "array") {
        if (value && typeof value === "string" && value.includes(",")) {
          const arr =
            value && value.split(",").map((v) => (!v ? null : parseFloat(v)));
          if (nullable) {
            arr.push(null);
            return arr;
          } else {
            return arr;
          }
        }
        return value
          ? getArray(parseFloat(value, 10), operator)
          : getArray(null, operator);
      } else {
        if (nullable) {
          return getArray(null, operator);
        }
        // eslint-disable-next-line no-case-declarations
        const num = parseFloat(value, 10);

        return getArray(num, operator);
      }
    default:
      return value;
  }
};
const parseTypeFloat = (val) => {
  return parseFloat(val);
};
const getPullId = (diffURL) => {
  const pid = diffURL.split("/");
  const id = pid[pid.length - 1].split(".")[0];
  return id;
};

class RulesetContainer extends Component {
  constructor(props) {
    super(props);
    const conditions = attributes.filter(
      (attr) => attr.type !== "object" && { name: attr.name, value: "" }
    );

    this.state = {
      activeTab: "Fields",
      generateFlag: false,
      message: "",
      error: {},
      pushError: "",
      pushFlag: false,
      accessToken: "",
      loading: false,
      prTitle: "",
      prBody: "",
      prURL: "",
      conditions: conditions,
      mergeFlag: false,
      showDiff: false,
      branch: "",
      branchSha: "",
    };
    this.generateFile = this.generateFile.bind(this);
    this.cancelAlert = this.cancelAlert.bind(this);
    this.onChangeMessage = this.onChangeMessage.bind(this);
    this.onChangeAccessToken = this.onChangeAccessToken.bind(this);
    this.onChangePR = this.onChangePR.bind(this);

    this.pushToRepo = this.pushToRepo.bind(this);
    this.handleAttributeUpdate = this.handleAttributeUpdate.bind(this);
    this.handleValue = this.handleValue.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.resetPushFields = this.resetPushFields.bind(this);
    this.merge = this.merge.bind(this);
    this.closeDiffView = this.closeDiffView.bind(this);
  }
  resetPushFields() {
    this.setState({
      prTitle: "",
      prBody: "",
      // prURL: '',
      message: "",
    });
  }
  handleAttributeUpdate(e, index) {
    const attribute = { ...this.state.conditions[index], name: e.value };
    const conditions = [
      ...this.state.conditions.slice(0, index),
      attribute,
      ...this.state.conditions.slice(index + 1),
    ];
    this.setState({ conditions });
  }

  handleValue(e, index) {
    let value;
    if (Array.isArray(e)) {
      value = e && e.map(({ value }) => value).join(",");
    } else {
      value = typeof e !== "string" ? e.value : e;
    }
    const attribute = { ...this.state.conditions[index], value };
    const conditions = [
      ...this.state.conditions.slice(0, index),
      attribute,
      ...this.state.conditions.slice(index + 1),
    ];
    this.setState({ conditions });
  }

  handleAdd() {
    this.setState({ conditions: this.state.conditions.concat([{ name: "" }]) });
  }
  onChangeMessage(e) {
    this.setState({ message: e.target.value, error: {} });
  }
  handleTab = (tabName) => {
    this.setState({ activeTab: tabName });
  };
  onChangeAccessToken(e) {
    this.setState({ accessToken: e.target.value, error: {} });
  }

  onChangePR(e, type) {
    this.setState({ [type]: e.target.value });
  }

  prepareFile() {
    const attributesMap = {};

    attributes.forEach(({ name, type, fieldType }) => {
      attributesMap[name] = { type, fieldType };
    });
    const { ruleset: { name = "rulesetDefault", data = [] } = {} } = this.props;

    const rules = data.map(({ expressions, note, yields, override }) => {
      if (override) {
        return {
          note,
          expressions: expressions.map(
            ({ name: lhs, operator, value: rhs = null, nullable }) => ({
              lhs,
              operator: getActualOperator({
                value: rhs,
                nullable,
                operator: operatorsMap[operator] || operator,
              }),
              rhs: getFormattedValue(
                rhs,
                attributesMap[lhs],
                nullable,
                operatorsMap[operator] || operator
              ),
            })
          ),
          yields: yields.map(({ partner, weight }) => ({
            partner,
            weight: parseTypeFloat(weight),
          })),
          override: true,
        };
      }
      return {
        note,
        expressions: expressions.map(
          ({ name: lhs, operator, value: rhs = null, nullable }) => ({
            lhs,
            operator: getActualOperator({
              value: rhs,
              nullable,
              operator: operatorsMap[operator] || operator,
            }),
            rhs: getFormattedValue(
              rhs,
              attributesMap[lhs],
              nullable,
              operatorsMap[operator] || operator
            ),
          })
        ),
        yields: yields.map(({ partner, weight }) => ({
          partner,
          weight: parseTypeFloat(weight),
        })),
      };
    });
    // converting from  name,value format to  lhs,rhs format
    // const expressions = ruleset.data.expressions.map(({ name: lhs, operator, value: rhs }) => ({
    // 	lhs,
    // 	operator: operatorsMap[operator] || operator,
    // 	rhs
    // }));
    const parts = name.split(".");
    let version = parseInt(parts[parts.length - 1], 10);
    version += 1;
    parts.splice(parts.length - 1, 1);
    parts.push(version);
    const updatedName = parts.join(".");

    const exportedObj = {
      name: updatedName || name,
      stage: "preference",
      rules,
    };
    return exportedObj;
  }
  async fetchData() {}
  generateFile() {
    const obj = this.prepareFile();
    const fileData = JSON.stringify(obj, null, 2);
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = obj.name + ".json";
    link.href = url;
    link.click();
    this.setState({ pushFlag: true });
  }
  closeDiffView() {
    this.setState({ showDiff: false, diffURL: "" });
  }

  async merge() {
    if (this.state.branch) {
      this.setState({ loading: true });
      await createBranch({
        token: this.state.accessToken,
        sha: this.state.branchSha,
        branch: this.state.branch,
      });

      const timestamp = new Date().toISOString().slice(0, 16).replace(":", "");
      const { html_url, diff_url } = await createPR({
        token: this.state.accessToken,
        title: this.state.prTitle || `Routing Rule Changes - ${timestamp}`,
        content: this.state.prBody || `Routing Rule Changes - ${timestamp}`,
        head: this.state.branch,
      });

      try {
        await mergePR({
          token: this.state.accessToken,
          pullId: getPullId(diff_url),
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
      this.closeDiffView();
      this.setState({ mergeFlag: true, loading: false, prURL: html_url });
      this.resetPushFields();
    }
  }
  async pushToRepo() {
    if (this.state.message === "") {
      this.setState({
        error: { message: "Commit message is required for pushing" },
      });
      return;
    }
    if (this.state.accessToken === "") {
      this.setState({
        error: { accessToken: "Access Token is required for pushing" },
      });
      return;
    }
    this.setState({ loading: true, prURL: "" });
    const obj = this.prepareFile();

    // get latest sha if the file already exists
    try {
      // eslint-disable-next-line no-unused-vars
      let sha;

      const { data: { sha: Sha } = {} } = await getSha({
        path: PREFERENCE_PATH,
        token: this.state.accessToken,
      });
      sha = Sha;

      let branchSha;
      const {
        object: { sha: bSha },
      } = await getBranchSha({
        path: PREFERENCE_PATH,
        token: this.state.accessToken,
      });
      branchSha = bSha;
      const treeItems = [];
      const branch = `routing-rule-changes-${new Date()
        .toISOString()
        .slice(0, 16)
        .replace(":", "")}`;
      //   await updateFile({
      //     message: this.state.message,
      //     content: JSON.stringify(obj, null, 2),
      //     sha,
      //     path: PREFERENCE_PATH,
      //     token: this.state.accessToken,
      //     branch,
      //   });
      const data = await createBlob({
        token: this.state.accessToken,
        content: JSON.stringify(obj, null, 2),
      });
      treeItems.push({
        path: `${PREFERENCE_PATH}`,
        sha: data.sha,
        mode: "100644",
        type: "blob",
      });

      const treeRsp = await createTree({
        token: this.state.accessToken,
        tree: treeItems,
        base_tree: branchSha,
      });

      const commitRsp = await createCommit({
        token: this.state.accessToken,
        message: this.state.message,
        tree: treeRsp.sha,
        parents: [branchSha],
      });

      this.setState({
        pushFlag: true,
        branch,
        showDiff: true,

        branchSha: commitRsp.sha,
      });
      this.resetPushFields();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log("err", err);
      let error = "Error occured while pushing";
      if (err.response && err.response.status === 401) {
        error = "Invalid Access Token";
      }
      this.setState({
        pushError: error,
      });
      // eslint-disable-next-line no-console
      console.log("err", err);
    }
    this.setState({ loading: false });
  }
  cancelAlert() {
    this.setState({
      generateFlag: false,
      pushFlag: false,
      pushError: "",
      mergeFlag: false,
    });
  }

  successAlert = ({
    msg = "rule is successfully generated at your default download location",
    error = false,
    title = "File generated",
  }) => {
    const { name } = this.props.ruleset;
    return (
      <SweetAlert
        success={!error}
        error={error}
        title={title}
        onConfirm={this.cancelAlert}
      >
        {`${name} ${msg}`}
      </SweetAlert>
    );
  };

  render() {
    const {
      decisions,
      name,
      data: { expressions = [] } = {},
    } = this.props.ruleset;

    const indexedDecisions =
      decisions &&
      decisions.length > 0 &&
      decisions.map((decision, index) => ({ ...decision, index }));
    let outcomes;
    if (indexedDecisions && indexedDecisions.length > 0) {
      outcomes = groupBy(
        indexedDecisions,
        (data) => data && data.event && data.event.type
      );
    }

    const message = Message.MODIFIED_MSG;
    // const message = this.props.updatedFlag ? Message.MODIFIED_MSG : Message.NO_CHANGES_MSG;
    // const uploadMessage = this.props.updatedFlag ? Message.UPLOAD_MSG : Message.NO_CHANGES_MSG;
    return (
      <div>
        <RuleErrorBoundary>
          <PageTitle name={name} onEdit={this.props.onUpdateRulesetName} />
          <Tabs
            tabs={tabs}
            onConfirm={this.handleTab}
            activeTab={this.state.activeTab}
          />
          <div className="tab-page-container">
            {this.state.activeTab === "Fields" && (
              <Attributes
                attributes={attributes}
                handleAttribute={this.props.handleAttribute}
              />
            )}
            {this.state.activeTab === "Rulesets" && (
              <Decisions
                decisions={indexedDecisions || []}
                attributes={attributes}
                handleDecisions={this.props.handleDecisions}
                handleAddRulesetData={this.props.handleAddRulesetData}
                outcomes={outcomes}
                changeRulecaseOrder={this.props.changeRulecaseOrderAction}
                ruleset={this.props.ruleset}
                handleAddItem={this.props.handleAddItem}
              />
            )}
            {this.state.activeTab === "Validate" && (
              <ValidateRules
                attributes={attributes}
                decisions={decisions}
                expressions={expressions}
                ruleset={this.props.ruleset}
                handleAttributeUpdate={this.handleAttributeUpdate}
                handleValue={this.handleValue}
                handleAdd={this.handleAdd}
                conditions={this.state.conditions}
              />
            )}
            {this.state.activeTab === "Generate" && (
              <>
                <Banner
                  message={message}
                  ruleset={this.props.ruleset}
                  onConfirm={this.generateFile}
                />
              </>
            )}
            {this.state.generateFlag && this.successAlert()}

            {this.state.activeTab === "Push" && (
              <>
                <div
                  className="add-attribute-wrapper"
                  style={{ marginTop: 32, marginLeft: 34 }}
                >
                  <div className="form-groups-inline">
                    <InputField
                      label="Commit Message"
                      onChange={this.onChangeMessage}
                      value={this.state.message}
                      error={this.state.error.message}
                    />
                  </div>
                  <div className="form-groups-inline">
                    <InputField
                      label="Github Access Token"
                      onChange={this.onChangeAccessToken}
                      value={this.state.accessToken}
                      error={this.state.error.accessToken}
                    />
                  </div>
                  <div className="form-groups-inline">
                    <InputField
                      label="PR Title"
                      onChange={(e) => this.onChangePR(e, "prTitle")}
                      value={this.state.prTitle}
                      error={this.state.error.prTitle}
                    />
                  </div>
                  <div className="form-groups-inline">
                    <InputField
                      label="PR Body"
                      onChange={(e) => this.onChangePR(e, "prBody")}
                      value={this.state.prBody}
                      error={this.state.error.prBody}
                    />
                  </div>
                  <div className="btn-group">
                    {this.state.error.message && this.state.message === "" && (
                      <span style={{ color: "red" }}>
                        {this.state.error.message}
                      </span>
                    )}
                    {this.state.error.accessToken &&
                      this.state.accessToken === "" && (
                        <span style={{ color: "red" }}>
                          {this.state.error.accessToken}
                        </span>
                      )}
                  </div>
                  {this.state.loading && <Loader />}
                  <Button
                    label="Push"
                    onConfirm={this.pushToRepo}
                    classname="primary-btn"
                  />

                  {this.state.prURL && (
                    <div style={{ marginTop: 24 }}>
                      <label>Latest Pull Request</label>
                      <br />
                      <div style={{ marginTop: 8 }}> Pull request URL : </div>
                      <a
                        href={this.state.prURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {this.state.prURL}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
            {this.state.showDiff ? (
              <Modal
                isOpen={this.state.showDiff}
                // onAfterOpen={afterOpenModal}
                onRequestClose={this.closeDiffView}
                style={{
                  content: {
                    // top: 100,
                    // left: "50%",
                    // right: "auto",
                    // bottom: "auto",
                    // marginRight: "-50%",
                    // width: 800,
                    // transform: "translate(-50%, -50%)",
                    top: 40,
                    bottom: 40,
                  },
                }}
                contentLabel="Diff View"
              >
                <h4>Diff View</h4>
                <hr />
                <div style={{ height: "80%", overflowY: "auto" }}>
                  <DiffRenderer
                    branch={this.state.branchSha}
                    token={this.state.accessToken}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Button
                    label={"Cancel"}
                    onConfirm={this.closeDiffView}
                    classname="btn-toolbar-small btn-warning"
                  />
                  <Button
                    label={"Merge"}
                    onConfirm={this.merge}
                    classname="btn-toolbar-small error"
                  />
                  {this.state.loading && <Loader />}
                </div>
              </Modal>
            ) : null}
            {this.state.mergeFlag &&
              this.successAlert({
                msg: "rule is successfully Merged to the repository",
                title: "Merged successfully",
              })}
            {this.state.pushError &&
              this.successAlert({
                msg: this.state.pushError,
                title: "Push failed",
                error: !!this.state.pushError,
              })}
          </div>
        </RuleErrorBoundary>
      </div>
    );
  }
}

RulesetContainer.propTypes = {
  ruleset: PropTypes.object,
  handleAttribute: PropTypes.func,
  handleDecisions: PropTypes.func,
  handleAddRulesetData: PropTypes.func,
  updatedFlag: PropTypes.bool,
  runRules: PropTypes.func,
  changeRulecaseOrderAction: PropTypes.func,
  handleAddItem: PropTypes.func,
  onUpdateRulesetName: PropTypes.func,
};

RulesetContainer.defaultProps = {
  ruleset: {},
  handleAttribute: () => false,
  handleDecisions: () => false,
  updatedFlag: false,
};

const mapStateToProps = (state) => ({
  ruleset: state.ruleset.rulesets[state.ruleset.activeRuleset],
  updatedFlag: state.ruleset.updatedFlag,
});

const mapDispatchToProps = (dispatch) => ({
  handleAttribute: (operation, attribute, index) =>
    dispatch(handleAttribute(operation, attribute, index)),
  handleDecisions: (operation, decision) =>
    dispatch(handleDecision(operation, decision)),
  handleAddRulesetData: (payload) => dispatch(addRulesetData(payload)),
  changeRulecaseOrderAction: (payload) =>
    dispatch(changeRulecaseOrder(payload)),
  handleAddItem: (payload) => dispatch(addNewItem(payload)),
  onUpdateRulesetName: (payload) => dispatch(updateRulesetName(payload)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RulesetContainer);
