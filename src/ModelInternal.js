"use strict";
const fs = require('fs');
const xmlReader = require('xml-reader');

/**
 * Internal model representation for a FeatureIDE feature-model
 */
class ModelInternal {
    static contains(oObj, sAttribute, sDefault = "") {
        return oObj[sAttribute] ? oObj[sAttribute] : sDefault
    }

    static readModelFile(sPath) {
        return new Promise((resolve, reject) => {
            const reader = xmlReader.create();
            reader.on("done", data => {
                resolve(new ModelInternal(data));
            });

            fs.readFile(sPath, {
                encoding: 'utf-8'
            }, (err, data) => {
                if (err) reject(err);
                reader.parse(data);
            })
        })
    }

    /**
     * Constructor for the internal model representation
     */
    constructor(model) {
        this._oFeatureTree;
        this._aCTCs;
        this._model = model;
        this._setupInternals();
    }

    _setupInternals() {
        const pickOut = oNode => {
            if (oNode.name === "struct") {
                this._oFeatureTree = oNode.children[0];
            }
            if (oNode.name === "constraints") {
                this._aCTCs = oNode.children;
            }
            if (oNode.name !== "struct" || oNode.name !== "constraints") {
                oNode.children.forEach(pickOut);
            }
        }
        pickOut(this._model);
    }

    getFeatureTree() {
        return this._oFeatureTree;
    }

    getFeatures() {
        
    }

    getCTCs() {
        return this._aCTCs;
    }
}

module.exports = ModelInternal;