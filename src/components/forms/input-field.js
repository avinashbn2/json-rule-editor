import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const InputField = (props) => {
	const { label, onChange, error, value, required, readOnly, placeholder, type = 'text' } = props;
	const [fieldValue, setFieldValue] = useState(value);

	useEffect(() => {
		setFieldValue(value);
	}, [value]);

	let errorClass = error ? 'error' : undefined;
	let readOnlyClass = readOnly ? 'readOnly' : undefined;

	const change = (e) => {
		setFieldValue(e.target.value);
		onChange(e);
		if (required && e.target.value) {
			errorClass = undefined;
		}
	};

	return (
		<div className="form-field" style={{ marginRight: 8 }}>
			{label && (
				<>
					<label>{label}</label>
					<br />
				</>
			)}
			<input
				style={props.style && { ...props.style }}
				type={type}
				onChange={change}
				value={fieldValue}
				className={`${errorClass} ${readOnlyClass}`}
				disabled={readOnly}
				placeholder={placeholder}
			/>
			{typeof error === 'string' && (
				<>
					{' '}
					<br />
					<span style={{ fontSize: 12, color: 'red' }}>{error}</span>
				</>
			)}
		</div>
	);
};

InputField.defaultProps = {
	label: undefined,
	onChange: () => undefined,
	error: undefined,
	value: '',
	required: false,
	readOnly: false,
	placeholder: ''
};

InputField.propTypes = {
	label: PropTypes.string,
	onChange: PropTypes.func,
	error: PropTypes.string,
	value: PropTypes.any,
	required: PropTypes.bool,
	readOnly: PropTypes.bool,
	placeholder: PropTypes.string,
	type: PropTypes.string,
	style: PropTypes.object
};

export default InputField;
