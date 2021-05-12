// operators mapping to convert between the engine format and the one needed by jessie rulesets
export const reverseOperatorsMap = {
  "==": "equal",
  "!=": "notEqual",
  "<=": "lessThanInclusive",
  "<": "lessThan",
  ">": "greaterThan",
  ">=": "greaterThanInclusive",
  not_in: "notIn",
};
export const getStringValue = (value) => {
  const nullIndex =
    Array.isArray(value) && value.findIndex((val) => val === null);
  if (
    nullIndex !== false &&
    nullIndex !== -1 &&
    value &&
    Array.isArray(value)
  ) {
    value.splice(nullIndex, 1);
  }

  if (value === "null") {
    return undefined;
  }
  return `${value}`;
};
export const getNullable = (value) => {
  return (
    value === null ||
    (Array.isArray(value) && value.findIndex((val) => val === null) !== -1)
  );
};
