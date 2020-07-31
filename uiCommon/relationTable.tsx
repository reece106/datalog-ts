import React, { useState } from "react";
import { ppt } from "../pretty";
import { Rec, Res, Relation } from "../types";
import { Interpreter } from "../interpreter";
import { TreeCollapseState, TreeView, emptyCollapseState } from "./treeView";
import { RuleC } from "./rule";
import { makeTermWithBindings } from "../traceTree";
import { TermView, noHighlight, HighlightProps } from "./term";
import { TraceView } from "./trace";
import { canTreeViz, treeFromRecords } from "./vizMappings/tree";
import { BareTerm } from "./replViews";

export type TableCollapseState = {
  [key: string]: TreeCollapseState;
};

export function RelationTable(props: {
  relation: Relation;
  interp: Interpreter;
  collapseState: TableCollapseState;
  setCollapseState: (c: TableCollapseState) => void;
  highlight: HighlightProps;
}) {
  let error: string = "";
  let results: Res[] = [];
  try {
    results =
      props.relation.type === "Table"
        ? props.relation.records.map((term) => ({
            term,
            bindings: {},
            trace: { type: "BaseFactTrace", fact: term },
          }))
        : props.interp.evalStmt({
            type: "Insert",
            record: props.relation.rule.head,
          })[0].results;
  } catch (e) {
    error = e.toString();
    console.error(e);
  }
  const fields =
    results.length === 0
      ? []
      : (props.relation.type === "Rule"
          ? Object.keys(props.relation.rule.head.attrs)
          : Object.keys((props.relation.records[0] as Rec).attrs)
        ).sort((a, b) => fieldComparator(a).localeCompare(fieldComparator(b)));
  return (
    <>
      {props.relation.type === "Rule" ? (
        <RuleC highlight={props.highlight} rule={props.relation.rule} />
      ) : null}
      {results.length === 0 ? (
        error === "" ? (
          <div style={{ fontStyle: "italic" }}>No results</div>
        ) : (
          <pre style={{ color: "red" }}>{error}</pre>
        )
      ) : (
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid black" }}>
              {props.relation.type === "Rule" ? <th /> : null}
              {fields.map((name) => (
                <th key={name} style={{ paddingLeft: 5, paddingRight: 5 }}>
                  <code>{name}</code>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => {
              const hl = props.highlight.highlight;
              const key = ppt(result.term);
              const rowCollapseState: TreeCollapseState = props.collapseState[
                key
              ] || { collapsed: true, childStates: {} };
              const toggleRowCollapsed = () => {
                props.setCollapseState({
                  ...props.collapseState,
                  [key]: {
                    ...rowCollapseState,
                    collapsed: !rowCollapseState.collapsed,
                  },
                });
              };
              const icon = rowCollapseState.collapsed ? ">" : "v";
              return (
                <React.Fragment key={`${idx}-${key}`}>
                  <tr
                    onClick={toggleRowCollapsed}
                    style={{ cursor: "pointer", fontFamily: "monospace" }}
                  >
                    {props.relation.type === "Rule" ? <td>{icon}</td> : null}
                    {fields.map((field) => (
                      <td
                        key={field}
                        style={{
                          paddingLeft: 5,
                          paddingRight: 5,
                          borderLeft: "1px solid lightgrey",
                          borderRight: "1px solid lightgrey",
                        }}
                      >
                        <TermView
                          term={makeTermWithBindings(
                            (result.term as Rec).attrs[field],
                            {}
                          )}
                          highlight={{
                            highlight: noHighlight,
                            setHighlight: () => {},
                            childPaths: [],
                            parentPaths: [],
                          }}
                          scopePath={[]}
                        />
                      </td>
                    ))}
                  </tr>
                  {rowCollapseState.collapsed ? null : (
                    <tr>
                      <td colSpan={fields.length + 1}>
                        <TraceView
                          result={result}
                          highlight={props.highlight}
                          collapseState={rowCollapseState}
                          setCollapseState={(st) =>
                            props.setCollapseState({
                              ...props.collapseState,
                              [key]: st,
                            })
                          }
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      <MaybeTreeViz results={results} />
    </>
  );
}

function MaybeTreeViz(props: { results: Res[] }) {
  if (props.results.length === 0) {
    return null;
  }
  if (!canTreeViz(props.results[0].term as Rec)) {
    return null;
  }
  const tree = treeFromRecords(
    props.results.map((res) => res.term as Rec),
    "0" // TODO: configurable root node
  );
  const [collapseState, setCollapseState] = useState(emptyCollapseState);
  return canTreeViz(props.results[0].term as Rec) ? (
    <div style={{ marginTop: 15 }}>
      Data as tree:
      <TreeView
        tree={tree}
        render={(node) =>
          node.item ? <BareTerm term={node.item} /> : "<root>"
        }
        collapseState={collapseState}
        setCollapseState={setCollapseState}
      />
    </div>
  ) : null;
}

function fieldComparator(field: string): string {
  switch (field) {
    case "id":
      return "aaaaaa_id";
    case "location":
      return "zzzzzz_location";
    default:
      return field;
  }
}
