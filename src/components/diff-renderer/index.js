import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { compare } from "../../api";
function DiffRenderer({ branch, token }) {
  const [lines, setLines] = useState([]);
  const getData = async (obj) => {
    const dt = await compare(obj);
    if (dt) {
      addNumbers(dt.split("\n"));
    }
  };
  const addNumbers = (lines) => {
    if (lines.length == 1 && lines[0] === "") {
      setLines([]);
      return;
    }
    const linesDict = [];
    const regex = /(\d+)/g;
    let lineNum = -1;
    lines.forEach((line) => {
      if (line.startsWith("@@")) {
        const start = line.match(regex);
        lineNum = start[0];
        linesDict.push({ line, number: -1 });
      } else {
        linesDict.push({ line, number: lineNum });
        lineNum++;
      }
    });
    setLines(linesDict);
  };
  useEffect(() => {
    if (branch) {
      getData({ branch, token });
    }
  }, [branch]);
  return (
    <div>
      {lines && lines.length > 0
        ? lines.map(({ line = "", number = -1 }, i) => (
            <div
              key={line + i}
              style={{
                backgroundColor: line.startsWith("-")
                  ? "#ffa69e"
                  : line.startsWith("+")
                  ? "#7CFFC4"
                  : "#FFFFFF",
              }}
            >
              {number !== -1 ? `${number} ` : " "} {line}
            </div>
          ))
        : "There are No Changes"}
    </div>
  );
}
DiffRenderer.propTypes = {
  branch: PropTypes.string,
  token: PropTypes.string,
};
export default DiffRenderer;
