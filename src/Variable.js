"use strict";

class Variable {
    constructor(iId, sName) {
        this._id = iId;
        this._name = sName;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }
}

class NegVariable extends Variable {
    constructor(oVariable) {
        super(oVariable.getId(), oVariable.getName());
        this._oVar = oVariable;
    }

    getId() {
        return this._oVar.getId() * -1;
    }

    getName() {
        return this._oVar.getName().indexOf('-') > -1 ? this._oVar.getName().replace('-', '') : `-${this._oVar.getName()}`;
    }
}

module.exports = {
    Variable,
    NegVariable
};