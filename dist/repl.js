"use strict";
exports.__esModule = true;
exports.fsLoader = exports.Repl = void 0;
var interpreter_1 = require("./interpreter");
var readline = require("readline");
var pretty_1 = require("./pretty");
var pp = require("prettier-printer");
var graphviz_1 = require("./graphviz");
var fs = require("fs");
var traceTree_1 = require("./traceTree");
var Repl = /** @class */ (function () {
    function Repl(input, out, mode, query, loader) {
        this.interp = new interpreter_1.Interpreter(__dirname, loader);
        this["in"] = input;
        this.out = out;
        this.buffer = "";
        this.mode = mode;
        if (query) {
            this.query = query;
        }
        else {
            this.query = null;
        }
    }
    Repl.prototype.run = function () {
        var _this = this;
        var opts = this.mode === "repl"
            ? {
                input: this["in"],
                output: this.out,
                prompt: "> "
            }
            : { input: this["in"] };
        var rl = readline.createInterface(opts);
        rl.on("line", function (line) {
            _this.handleLine(line);
        });
        rl.prompt();
        rl.on("close", function () {
            if (_this.query) {
                _this.handleLine(_this.query);
            }
        });
        this.rl = rl;
    };
    Repl.prototype.handleLine = function (line) {
        var _this = this;
        var rl = this.rl;
        if (line.length === 0) {
            rl.prompt();
            return;
        }
        // special commands
        // TODO: parse these with parser
        if (line === ".dump") {
            this.println(pp.render(100, pretty_1.prettyPrintDB(this.interp.db)));
            rl.prompt();
            return;
        }
        else if (line === ".resetFacts") {
            this.interp.db.tables = {};
            rl.prompt();
            return;
        }
        else if (line === ".graphviz") {
            // TODO: remove dot...
            // TODO: allow whole config to be passed in...
            this.doGraphviz({ query: "node{id: I, label: L}", idAttr: "id", labelAttr: "label" }, {
                query: "edge{from: F, to: T, label: L}",
                labelAttr: "label",
                fromAttr: "from",
                toAttr: "to"
            });
            rl.prompt();
            return;
        }
        else if (line === ".ruleGraph") {
            this.doGraphviz({
                query: "internal.Relation{name: N, type: T}",
                idAttr: "name",
                labelAttr: "name"
            }, {
                query: "internal.RelationReference{from: F, to: T}",
                fromAttr: "from",
                toAttr: "to"
            });
            rl.prompt();
            return;
        }
        this.buffer = this.buffer + line;
        if (!(line.endsWith(".") || line.startsWith(".") || line.startsWith("#"))) {
            return;
        }
        try {
            var _a = this.interp.evalStr(this.buffer), stmtResult_1 = _a[0], interp = _a[1];
            this.interp = interp;
            stmtResult_1.results.forEach(function (res) {
                _this.println(stmtResult_1.trace
                    ? pretty_1.prettyPrintTrace(traceTree_1.traceToTree(res), pretty_1.defaultTracePrintOpts)
                    : pp.render(100, pretty_1.prettyPrintTerm(res.term)) + ".");
            });
        }
        catch (e) {
            // TODO: distinguish between parse errors and others
            this.println("error", e.toString(), e.stack);
            if (this.mode === "pipe") {
                process.exit(-1);
            }
        }
        finally {
            this.buffer = "";
        }
        rl.prompt();
    };
    Repl.prototype.doGraphviz = function (nodesConfig, edgesConfig) {
        var edges = this.interp.queryStr(edgesConfig.query);
        var nodes = this.interp.queryStr(nodesConfig.query);
        // TODO: oof, all this typecasting
        var g = {
            edges: edges.results.map(function (e) {
                var rec = e.term;
                return {
                    from: rec.attrs[edgesConfig.fromAttr].val,
                    to: rec.attrs[edgesConfig.toAttr].val,
                    attrs: {
                        label: edgesConfig.labelAttr
                            ? rec.attrs[edgesConfig.labelAttr].val
                            : ""
                    }
                };
            }),
            nodes: nodes.results.map(function (n) {
                var _a;
                var rec = n.term;
                return {
                    id: rec.attrs[nodesConfig.idAttr].val,
                    attrs: {
                        label: (_a = rec.attrs[nodesConfig.labelAttr]) === null || _a === void 0 ? void 0 : _a.val
                    }
                };
            })
        };
        this.println(graphviz_1.prettyPrintGraph(g));
    };
    Repl.prototype.println = function () {
        var strings = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            strings[_i] = arguments[_i];
        }
        // console.log("printing", strings[0], strings[1], strings[2]);
        this.out.write(strings.join(" ") + "\n");
    };
    return Repl;
}());
exports.Repl = Repl;
exports.fsLoader = function (path) { return fs.readFileSync(path).toString(); };
