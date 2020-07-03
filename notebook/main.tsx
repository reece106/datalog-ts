import React from "react";
import ReactDOM from "react-dom";
import { useFetch } from "use-http";
import { HashRouter as Router, Switch, Route, Link } from "react-router-dom";
import { MarkdownDoc, parse } from "./markdown";

function Viewer(props: { username: string; gistID: string }) {
  const gistURL = `https://gist.githubusercontent.com/${props.username}/${props.gistID}/raw/`;

  const { loading, error, data = "" } = useFetch(gistURL, {}, []);

  const parsedDoc = parse(data);

  return (
    <>
      <h1>Notebook viewer</h1>
      <MarkdownDoc doc={parsedDoc} blockIdxToHeadingIdx={{}} headingRefs={[]} />
    </>
  );
}

function HomePage() {
  return (
    <>
      <h1>Notebook viewer</h1>
      <p>Welcome</p>
      <p>Examples:</p>
      <ul>
        <li>
          <Link to="/notebook/gist/vilterp/9f06dbef549ab0fec87d7a79df05cf50">
            Family
          </Link>
        </li>
      </ul>
    </>
  );
}

function Main() {
  return (
    <div
      className="markdown-body"
      style={{
        maxWidth: "60rem",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 20,
        marginTop: 20,
        paddingLeft: 10,
        paddingRight: 10,
      }}
    >
      <Router>
        <Switch>
          <Route path="/" exact>
            <HomePage />
          </Route>
          <Route
            path="/notebook/gist/:username/:gistID"
            render={({ match }) => (
              <Viewer
                username={match.params.username}
                gistID={match.params.gistID}
              />
            )}
          />
        </Switch>
      </Router>
    </div>
  );
}

ReactDOM.render(<Main />, document.getElementById("main"));
