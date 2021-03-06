"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.substitute = exports.unifyVars = exports.termLT = exports.termEq = exports.termSameType = exports.unify = void 0;
var types_1 = require("./types");
var util_1 = require("./util");
function unify(prior, left, right) {
    // console.group("unify", {
    //   prior: ppb(prior),
    //   left: ppt(left),
    //   right: ppt(right),
    // });
    var res = doUnify(prior, left, right);
    // console.groupEnd();
    // console.log("res", res ? ppb(res) : null);
    return res;
}
exports.unify = unify;
function doUnify(prior, left, right) {
    var _a, _b, _c, _d, _e;
    switch (left.type) {
        case "StringLit":
        case "IntLit":
        case "Bool":
            if (right.type === left.type) {
                return left.val === right.val ? {} : null;
            }
            else if (right.type === "Var") {
                return _a = {}, _a[right.name] = left, _a;
            }
            else {
                return null;
            }
        case "Var":
            var priorBinding = prior[left.name];
            if (priorBinding) {
                if (priorBinding.type === "Var") {
                    return _b = {}, _b[left.name] = right, _b;
                }
                if (unify({}, priorBinding, right)) {
                    return _c = {}, _c[left.name] = right, _c;
                }
                return null;
            }
            return _d = {}, _d[left.name] = right, _d;
        case "Record": {
            switch (right.type) {
                case "Record":
                    var accum = {};
                    for (var _i = 0, _f = Object.keys(left.attrs); _i < _f.length; _i++) {
                        var key = _f[_i];
                        // TODO: do bindings fold across keys... how would that be ordered...
                        var leftVal = left.attrs[key];
                        var rightVal = right.attrs[key];
                        if (!rightVal) {
                            continue;
                        }
                        var res = unify(prior, leftVal, rightVal);
                        if (res === null) {
                            return null; // TODO: error message here would be nice saying what we can't unify
                        }
                        accum = __assign(__assign({}, accum), res);
                    }
                    return accum;
                case "Var":
                    return _e = {}, _e[right.name] = left, _e;
                default:
                    return null;
            }
        }
        case "Array":
            switch (right.type) {
                case "Array":
                    if (left.items.length != right.items.length) {
                        return null;
                    }
                    var accum = {};
                    for (var i = 0; i < left.items.length; i++) {
                        var leftItem = left.items[i];
                        var rightItem = right.items[i];
                        var res = unify(prior, leftItem, rightItem);
                        if (res === null) {
                            return null; // TODO: error message?
                        }
                        accum = __assign(__assign({}, accum), res);
                    }
                    return accum;
                // TODO: add Var case?
                default:
                    return null;
            }
        default:
            return null;
    }
}
function termSameType(left, right) {
    return left.type === right.type;
}
exports.termSameType = termSameType;
// could use some kind of existing JS deepEq
function termEq(left, right) {
    if (!left || !right) {
        return false; // TODO: shouldn't get here
    }
    switch (left.type) {
        case "StringLit":
        case "IntLit":
        case "Bool":
            return left.type === right.type && left.val === right.val;
        case "Var":
            switch (right.type) {
                case "Var":
                    return left.name === right.name;
                default:
                    return false;
            }
        case "Record":
            switch (right.type) {
                case "Record":
                    for (var _i = 0, _a = Object.keys(left.attrs); _i < _a.length; _i++) {
                        var key = _a[_i];
                        var rightVal = right.attrs[key];
                        var leftVal = left.attrs[key];
                        if (!termEq(leftVal, rightVal)) {
                            return false;
                        }
                    }
                    return Object.keys(left).length === Object.keys(right).length;
                default:
                    return null;
            }
    }
}
exports.termEq = termEq;
function termLT(left, right) {
    switch (left.type) {
        case "IntLit":
            switch (right.type) {
                case "IntLit":
                    return left.val < right.val;
                default:
                    return false;
            }
        case "StringLit":
            switch (right.type) {
                case "StringLit":
                    return left.val < right.val;
                default:
                    return false;
            }
        default:
            return false;
    }
}
exports.termLT = termLT;
function unifyVars(left, right) {
    var res = {};
    for (var _i = 0, _a = Object.keys(left); _i < _a.length; _i++) {
        var leftKey = _a[_i];
        var leftVal = left[leftKey];
        var rightVal = right[leftKey];
        // console.log("unifyvars", leftKey, leftVal, rightVal);
        if (rightVal) {
            if (!unify({}, rightVal, leftVal)) {
                return null; // TODO: nice error message showing mismatch
            }
        }
        res[leftKey] = leftVal;
    }
    var onlyInRight = Object.keys(right).filter(function (key) { return !left[key]; });
    for (var _b = 0, onlyInRight_1 = onlyInRight; _b < onlyInRight_1.length; _b++) {
        var key = onlyInRight_1[_b];
        res[key] = right[key];
    }
    return res;
}
exports.unifyVars = unifyVars;
function substitute(term, bindings) {
    switch (term.type) {
        case "Record":
            return types_1.rec(term.relation, util_1.mapObj(term.attrs, function (k, t) { return substitute(t, bindings); }));
        case "Var":
            return bindings[term.name] ? bindings[term.name] : term; // TODO: handling missing. lol
        default:
            return term;
    }
}
exports.substitute = substitute;
