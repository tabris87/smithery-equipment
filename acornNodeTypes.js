/*Taken from https://github.com/acornjs/acorn
 *to ensure compatibility with the esprima format and tools.
 *
 *Distributed under MIT-LICENCSE:
 *
 * Copyright (C) 2012-2018 by various contributors (see AUTHORS)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.

var Node = function Node(pos) {
    this.type = "";
    this.start = pos;
    this.end = 0;
};

var SourceLocation = function SourceLocation(start, end, sourceFile) {
    this.start = start;
    this.end = end;
    if (typeof sourceFile !== "undefined") {
        this.source = sourceFile;
    }
};

module.exports = {
    Node: Node,
    SourceLocation: SourceLocation
}
