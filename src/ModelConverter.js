"use strict";

const ModelInternal = require('./ModelInternal');
const {
    Variable,
    NegVariable
} = require('./Variable');

const OPTIONAL_NAME = "and";
const ALTERNATIVE_NAME = "alt";

/**
 * Converting every FeatureIDE into a CNF
 * AND's of OR's
 * 
 * Line is OR'
 * Each line connected by AND
 */
class ModelConverter {
    constructor(oModel) {
        this._nbFeatures = 0;
        this._nbClauses = 0;
        this._mFeatures = {}
        this._aCNFClauses = [];
        this._model = this.setModel(oModel);
    }

    getModel() {
        return this._model;
    }

    setModel(oModel) {
        if (oModel instanceof ModelInternal) {
            this._model = oModel;
        } else {
            this._model = new ModelInternal(oModel);
        }

        this._createCNFPresentation();
        return this._model;
    }

    //#region internal methods

    _createCNFPresentation() {
        var oFeatureTree = this._model.getFeatureTree();
        if (oFeatureTree) {
            this._createRootNode(oFeatureTree);
            oFeatureTree.parent = undefined;
            oFeatureTree.children.forEach((oChild) => {
                oChild.parent = oFeatureTree;
                this._traverse(oChild)
            });
        }
        //* from here we have to convert the CTC's also
        var aCTCs = this._model.getCTCs();
        aCTCs.forEach(this._addCTCtoCNF.bind(this));
    }

    _addCTCtoCNF(oRule) {
        const negateTerm = oTerm => {
            if (Array.isArray(oTerm)) {
                return oTerm.map(oP => negateTerm(oP));
            } else {
                return new NegVariable(oTerm);
            }
        };

        const traverseCTC = oCTC => {
            if (oCTC.name === "imp") {
                //negate first operand and keep second
                // concat both togheter
                let aFirstOperand = traverseCTC(oCTC.children[0]);
                let aSecondOperand = traverseCTC(oCTC.children[1]);
                debugger;
                aFirstOperand = !Array.isArray(aFirstOperand) ? [aFirstOperand] : aFirstOperand;
                aSecondOperand = !Array.isArray(aSecondOperand) ? [aSecondOperand] : aSecondOperand;

                aFirstOperand = negateTerm(aFirstOperand);
                return aSecondOperand.map(oS => aFirstOperand.concat(oS));
            } else if (oCTC.name === "var") {
                //retrieve variable from known
                let sVarName = oCTC.children[0].value;
                if (!this._mFeatures[sVarName]) {
                    this._mFeatures[sVarName] = new Variable(Object.keys(this._mFeatures).length + 1, sVarName);
                }
                return this._mFeatures[sVarName];
            } else if (oCTC.name === "conj") {
                //return an array of variables
                return oCTC.children.map(traverseCTC);
            } else if (oCTC.name === "disj") {
                //return an array of arrays
                return oCTC.children.map(oChild => [traverseCTC(oChild)]);
            } else if (oCTC.name === "not") {
                return negateTerm(traverseCTC(oCTC.children[0]));
            } else {
                throw new Error(`Unknown constraint type ${oCTC.name}!`)
            }
        }

        let oConstraint = oRule.children.filter(oCh => oCh.name !== "description");
        if (oConstraint.length > 1) {
            throw new Error(`Unknown rule type with more than one (${oConstraint.length}) Children!`);
        }
        this._aCNFClauses = this._aCNFClauses.concat(traverseCTC(oConstraint[0]));
    }

    _traverse(node) {
        if (node.name === "feature") {
            this._createSubFeature(node, ModelInternal.contains(node.attributes, "mandatory", false));
        } else if (node.name === "alt") {
            this._createAlternativeGroup(node);
        } else if (node.name === "and") {
            this._createAndGroup(node);
        } else if (node.name === "or") {
            this._createOrGroup(node);
        } else {
            throw new Error(`Unknown node type: ${node.name}!`);
        }
    }

    _createRootNode(oRootNode) {
        var sName = ModelInternal.contains(oRootNode.attributes, "name", "unnamed");
        if (!this._mFeatures[sName]) {
            this._mFeatures[sName] = new Variable(Object.keys(this._mFeatures).length + 1, sName);
        }
        this._aCNFClauses.push([this._mFeatures[sName]]);
    }

    _createSubFeature(oNode, bMandatory = false) {
        var oParent = oNode.parent;
        var sParentName = ModelInternal.contains(oParent.attributes, "name", "unnamed");
        var sNodeName = ModelInternal.contains(oNode.attributes, "name", "unnamed");
        if (!this._mFeatures[sNodeName]) {
            this._mFeatures[sNodeName] = new Variable(Object.keys(this._mFeatures).length + 1, sNodeName);
        }

        this._aCNFClauses.push([this._mFeatures[sParentName], new NegVariable(this._mFeatures[sNodeName])]);

        if (bMandatory) {
            this._aCNFClauses.push([this._mFeatures[sNodeName], new NegVariable(this._mFeatures[sParentName])]);
        }
    }

    _createAndGroup(node) {
        let aChildren = node.children;
        this._createSubFeature(node, ModelInternal.contains(node.attributes, "mandatory", false));
        aChildren.forEach(oChild => this._traverse(oChild));
    }

    _createOrGroup(node) {
        let aChildren = node.children;
        this._createSubFeature(node, ModelInternal.contains(node.attributes, "mandatory", false));
        var sNodeName = ModelInternal.contains(node.attributes, "name", "unnamed");
        var aChildrenName = aChildren.map(oChild => ModelInternal.contains(oChild.attributes, "name", "unnamed"));
        aChildrenName.forEach(sName => {
            if (!this._mFeatures[sName]) {
                this._mFeatures[sName] = new Variable(Object.keys(this._mFeatures).length + 1, sName);
            }
        })

        aChildren.forEach(oChild => this._traverse(oChild));
        this._aCNFClauses.push(aChildrenName.map(sName => {
            if (!this._mFeatures[sName]) {
                this._mFeatures[sName] = new Variable(Object.keys(this._mFeatures).length + 1, sName);
            }

            return this._mFeatures[sName]
        }).concat(new NegVariable(this._mFeatures[sNodeName])));
    }

    _createAlternativeGroup(node) {
        let aChildren = node.children;
        this._createSubFeature(node, ModelInternal.contains(node.attributes, "mandatory", false));
        var sNodeName = ModelInternal.contains(node.attributes, "name", "unnamed");
        var aChildrenName = aChildren.map(oChild => ModelInternal.contains(oChild.attributes, "name", "unnamed"));
        aChildrenName.forEach(sName => {
            if (!this._mFeatures[sName]) {
                this._mFeatures[sName] = new Variable(Object.keys(this._mFeatures).length + 1, sName);
            }
        })

        aChildren.forEach(oChild => this._traverse(oChild));
        /* aChildrenName.forEach(sCN => this._aCNFClauses.push([this._mFeatures[sNodeName], new NegVariable(this._mFeatures[sCN])])); */
        this._aCNFClauses.push(aChildrenName.map(sName => {
            if (!this._mFeatures[sName]) {
                this._mFeatures[sName] = new Variable(Object.keys(this._mFeatures).length + 1, sName);
            }

            return this._mFeatures[sName]
        }).concat(new NegVariable(this._mFeatures[sNodeName])));

        for (var i = 0; i < aChildrenName.length - 1; i++) {
            for (var j = i + 1; j < aChildrenName.length; j++) {
                this._aCNFClauses.push([new NegVariable(this._mFeatures[aChildrenName[i]]), new NegVariable(this._mFeatures[aChildrenName[j]])])
            }
        }
    }

    //#endregion
    getCNFString(bDimacs = false, bName = false) {
        let sHeader = "";
        if (bDimacs) {
            let aFeatures = this.getFeatures();
            let sFeatureList = aFeatures
                .map(oFeature => `c ${oFeature.getId()} ${oFeature.getName()}`)
                .reduce((sComplete, sComment) => `${sComplete}\n${sComment}`);
            //p cnf <numVariables> <numClauses>
            let sProblemLine = `p cnf ${aFeatures.length} ${this._aCNFClauses.length}`;
            sHeader = `${sFeatureList}\n${sProblemLine}`;
        }

        let sBody = this._aCNFClauses
            .map((aCL) => aCL.reduce((sCL, sF) => bName ? `${sCL} ${sF.getName()}`.trim() : `${sCL} ${sF.getId()}`.trim(), ""))
            .reduce((sComplete, sCL) => bDimacs ? `${sComplete}\n${sCL} 0`.trim() : `${sComplete}\n${sCL}`.trim(), "");

        return sHeader !== "" ? `${sHeader}\n${sBody}` : sBody;

    }

    getFeatures() {
        return Object.values(this._mFeatures);
    }

    getCNFClauses() {
        return [...this._aCNFClauses];
    }

}

module.exports = ModelConverter;