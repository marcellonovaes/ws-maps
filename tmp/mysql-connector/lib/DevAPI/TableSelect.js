/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

"use strict";

const Client = require('../Protocol/Client'),
    Column = require('./Column'),
    Result = require('./Result'),
    Expressions = require('../Expressions'),
    Table = require('./Table');

/**
 *
 * @param {XSession} session
 * @param {Schema} schema
 * @param {Table} table
 * @param {Array.<String>} projection
 * @constructor
 */
function TableSelect(session, schema, table, projection) {
    this._session = session;
    this._schema = schema;
    this._table = table;
    this._projection = projection;
    this._where = null;
    this._groupby = null;
    this._having = null;
    this._orderby = null;
    this._limit = null;
    this._bounds = {};
}

module.exports = TableSelect;

/**
 * Add where clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.where = function (expr) {
    this._where = expr;
    return this;
};

/**
 * Add Group By clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.groupBy = function (expr) {
    this._groupby = expr;
    return this;
};

/**
 * Add having clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.having = function (expr) {
    this._having = expr;
    return this;
};

/**
 * Add order by clause
 * @param expr
 * @returns {TableSelect}
 */
TableSelect.prototype.orderBy = function (expr) {
    this._orderby = expr;
    return this;
};

/**
 * Add limit and offset
 *
 * @param {Number} count
 * @param {Number} [offset]
 * @returns {TableSelect}
 */
TableSelect.prototype.limit = function (count, offset) {
    this._limit = {
        count: count,
        offset: offset
    };
    return this;
};

TableSelect.prototype.bind = function (bind) {
    Object.assign(this._bounds, bind);
    return this;
};

/**
 * Execute find operation
 * @param {documentCallback} [rowcb]
 * @param {Array<Column>} [metacb]
 * @return {Promise.<Result>}
 */
TableSelect.prototype.execute = function (rowcb, metacb) {
    var projection = this._projection.map(function (field) {
        const splitted = field.split(/\sas\s/i);
        if (splitted.length > 2) {
            throw new Error("Multiple instances of AS");
        }
        return {
            source: {
                type: 1,
                identifier: {
                    name: splitted[0]
                }
            },
            alias: splitted[1]
        };
    });

    return this
        ._session
        ._client
        .crudFind(this._session, this._schema.getName(), this._table, Client.dataModel.TABLE, projection, this._where, this._groupby, this._having, this._orderby, this._limit, rowcb, Column.metaCB(metacb), this._bounds)
        .then(state => new Result(state));
};

TableSelect.prototype.getViewDefinition = function() {
    //console.log(Table, new Table(), Table.escapeIdentifier);
    //let retval = "SELECT " + this._projection.join(", ") + " FROM " + Table.escapeIdentifier(this._schema.getName()) + '.' + Table.escapeIdentifier(this._table);
    let retval = "SELECT " + this._projection.join(", ") + " FROM " + this._schema.getName() + '.' + this._table;
    if (this._where) {
        retval += " WHERE " + this._where;
    }
    if (this._orderby) {
        retval += " ORDER BY " + this._orderby.join(", ");
    }
    return retval;
};