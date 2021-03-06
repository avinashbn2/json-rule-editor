import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { login } from '../../actions/app';
import { uploadRuleset } from '../../actions/ruleset';
import { TitlePanel } from '../../components/panel/panel';
import Button from '../../components/button/button';
import { createHashHistory } from 'history';
import FooterLinks from '../../components/footer/footer';
import footerLinks from '../../data-objects/footer-links.json';
import { includes } from 'lodash/collection';
import Notification from '../../components/notification/notification';
import { RULE_AVAILABLE_UPLOAD, RULE_UPLOAD_ERROR } from '../../constants/messages';
import { getContent } from '../../api';
import Loader from '../../components/loader/loader';
import InputField from '../../components/forms/input-field';

import { PREFERENCE_PATH } from '../../constants/paths.json';
function readFile(file, cb) {
	// eslint-disable-next-line no-undef
	var reader = new FileReader();
	reader.onload = () => {
		try {
			cb(JSON.parse(reader.result), file.name);
		} catch (e) {
			cb(undefined, undefined, e.message);
		}
	};
	return reader.readAsText(file);
}

class HomeContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uploadedFilesCount: 0,
			files: [],
			ruleset: [],
			uploadError: false,
			fileExist: false,
			message: {},
			accessToken: '',
			error: {}
		};
		this.drop = this.drop.bind(this);
		this.allowDrop = this.allowDrop.bind(this);
		this.printFile = this.printFile.bind(this);
		this.handleUpload = this.handleUpload.bind(this);
		this.chooseDirectory = this.chooseDirectory.bind(this);
		this.fetchLatest = this.fetchLatest.bind(this);
		this.onChangeAccessToken = this.onChangeAccessToken.bind(this);
	}

	onChangeAccessToken(e) {
		this.setState({ accessToken: e.target.value, error: {} });
	}

	async fetchLatest() {
		if (this.state.accessToken === '') {
			this.setState({ error: { accessToken: 'Please enter a valid access token' } });
			return;
		}
		this.setState({ loading: true, error: {} });
		try {
			const { data: { content } = {} } = await getContent({
				path: PREFERENCE_PATH,
				token: this.state.accessToken
			});
			this.setState({ ruleset: [JSON.parse(atob(content))] }, () => {
				this.props.uploadRuleset(this.state.ruleset);
				this.navigate('/ruleset');
			});
		} catch (err) {
			// eslint-disable-next-line no-console
			console.log(err, err.response.status);
			if (err.response.status === 401) {
				this.setState({ error: { accessToken: 'Invalid access token' } });
			} else {
				this.setState({ error: { accessToken: 'Error occured while fetching ruleset' } });
			}
		}
		this.setState({ loading: false });
	}

	allowDrop(e) {
		e.preventDefault();
	}

	printFile(file, name, error) {
		if (error) {
			this.setState({ uploadError: true, fileExist: false, message: RULE_UPLOAD_ERROR });
		} else {
			const isFileAdded =
				this.state.files.some((fname) => fname === name) ||
				includes(this.props.rulenames, file.name);
			if (!isFileAdded) {
				const files = this.state.files.concat([name]);
				const ruleset = this.state.ruleset.concat(file);

				this.setState({ files, ruleset, fileExist: false });
			} else {
				const message = {
					...RULE_AVAILABLE_UPLOAD,
					heading: RULE_AVAILABLE_UPLOAD.heading.replace('<name>', file.name)
				};
				this.setState({ fileExist: true, message });
			}
		}
	}

	uploadFile(items, index) {
		const file = items[index].getAsFile();
		readFile(file, this.printFile);
	}

	uploadDirectory(item) {
		var dirReader = item.createReader();
		const print = this.printFile;
		dirReader.readEntries(function (entries) {
			for (let j = 0; j < entries.length; j++) {
				let subItem = entries[j];
				if (subItem.isFile) {
					subItem.file((file) => {
						readFile(file, print);
					});
				}
			}
		});
	}

	// this method is not required. its to select files from local disk.
	/* chooseFile() {
    const file = document.getElementById("uploadFile");
    if (file && file.files) {
      for (let i = 0; i < file.files.length; i++) {
        readFile(file.files[i], this.printFile);
      }
    }
   } */

	chooseDirectory(e) {
		const files = e.target.files;
		if (files) {
			for (let i = 0; i < files.length; i++) {
				if (files[i].type === 'application/json') {
					readFile(files[i], this.printFile);
				}
			}
		}
	}

	drop(e) {
		e.preventDefault();
		const items = e.dataTransfer.items;
		if (items) {
			for (let i = 0; i < items.length; i++) {
				let item = items[i].webkitGetAsEntry();
				if (item.isFile) {
					this.uploadFile(items, i);
				} else if (item.isDirectory) {
					this.uploadDirectory(item);
				}
			}
		}
	}

	handleUpload() {
		if (this.state.ruleset.length > 0) {
			this.props.uploadRuleset(this.state.ruleset);
			this.navigate('/ruleset');
		}
	}

	navigate(location) {
		const history = createHashHistory();
		this.props.login();
		history.push(location);
	}
	render() {
		const { fileExist, uploadError, message } = this.state;
		const title = 'Get started on your Preference Rules';
		return (
			<div className="home-container">
				<div className="single-panel-container">
					{(fileExist || uploadError) && (
						<Notification body={message.body} heading={message.heading} type={message.type} />
					)}
					<TitlePanel title={title} titleClass="fa fa-cloud-upload">
						<div className="col">
							<div className="row" style={{ position: 'relative', paddingTop: 24 }}>
								<InputField
									label="Github Access Token"
									onChange={this.onChangeAccessToken}
									value={this.state.accessToken}
									error={this.state.error.accessToken}
								/>
								<Button
									label={'Get Latest'}
									onConfirm={this.fetchLatest}
									classname="primary-btn"
									type="button"
									// disabled={this.state.accessToken === ''}
								/>
								<div
									style={{
										top: 100,
										position: 'absolute',
										zIndex: 10,
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										width: 700
									}}
								>
									{this.state.loading && <Loader />}
								</div>
							</div>
							<div className="separator">OR</div>
							<div className="row">
								<div className="upload-panel">
									<div className="drop-section" onDrop={this.drop} onDragOver={this.allowDrop}>
										{this.state.files.length > 0 ? (
											<>
												<div className="file-drop-msg">
													{`${this.state.files.length} json file is selected!`}{' '}
													<a
														href=""
														onClick={(e) => {
															e.preventDefault();
															this.setState({ files: [] });
														}}
													>
														<span className="fa fa-close" style={{ color: 'red' }} />
													</a>
												</div>
											</>
										) : (
											<div>
												<label htmlFor="uploadFile">
													Choose Ruleset File
													<input
														id="uploadFile"
														type="file"
														onChange={this.chooseDirectory}
														// webkitdirectory="true"
													/>
												</label>{' '}
												or Drop File
											</div>
										)}
									</div>
								</div>{' '}
								<div className="btn-group">
									<Button
										label={'Upload'}
										onConfirm={this.handleUpload}
										classname="primary-btn"
										type="button"
										disabled={this.state.files.length === 0}
									/>
								</div>
							</div>

							{!this.props.loggedIn && (
								<>
									<div className="separator">OR</div>
									<div className="row ">
										<div style={{ marginLeft: 12, marginTop: 20 }}>
											<label htmlFor="uploadFile"> Create a new file</label>
										</div>{' '}
										<Button
											label={'Create'}
											onConfirm={() => this.navigate('/create-ruleset')}
											classname="primary-btn"
											type="button"
											disabled={this.state.files.length > 0}
										/>
									</div>
								</>
							)}
						</div>
					</TitlePanel>
				</div>
				{!this.props.loggedIn && (
					<div className="footer-container home-page">
						<FooterLinks links={footerLinks} />
					</div>
				)}
			</div>
		);
	}
}

HomeContainer.propTypes = {
	ruleset: PropTypes.array,
	uploadRuleset: PropTypes.func,
	login: PropTypes.func,
	loggedIn: PropTypes.bool,
	rulenames: PropTypes.array
};

HomeContainer.defaultProps = {
	rulenames: [],
	ruleset: [],
	uploadRuleset: () => false,
	login: () => false,
	loggedIn: false
};

const mapStateToProps = (state) => ({
	rulenames: state.ruleset.rulesets.map((r) => r.name),
	loggedIn: state.app.loggedIn
});

const mapDispatchToProps = (dispatch) => ({
	login: () => dispatch(login()),
	uploadRuleset: (ruleset) => dispatch(uploadRuleset(ruleset))
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeContainer);
