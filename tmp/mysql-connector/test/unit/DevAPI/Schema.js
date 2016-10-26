"use strict";

/*global
 describe, context, beforeEach, afterEach, Messages, Server, Encoding, mysqlxtest, it, beforeEach, chai
 */
chai.should();

describe('DevAPI', function () {
    context('Schema', function () {
        let session, schema;
        beforeEach('get Session', function () {
            return mysqlxtest.getNullSession().then(function (s) {
                session = s;
                schema = session.getSchema("schema");
            });
        });


        it('Should know its name', function () {
            schema.getName().should.equal("schema");
        });

        it('Should provide access to the schema (aka. itself)', function () {
            schema.getSchema().should.deep.equal("schema");
        });
        it('Should provide access to the session', function () {
            schema.getSession().should.deep.equal(session);
        });

        function createResponse(protocol, row) {
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
                name: "_doc",
                table: "table",
                schema: "schema"
            }, Encoding.serverMessages));
            if (row) {
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: ["\x01"]}, Encoding.serverMessages));
            }
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
        }

        it('should return true if exists in database', function () {
            const promise = schema.existsInDatabase();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });
        it('should return false if it doesn\'t exists in database', function () {
            const promise = schema.existsInDatabase();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return an empty list for no collection', function () {
            const promise = schema.getCollections();

            const result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "name"
            },{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "type"
            }]);
            result.finalize();

            return promise.should.eventually.deep.equal({});
        });
        it('should return an list of collections', function () {
            const promise = schema.getCollections();

            const result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "name"
            },{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "type"
            }]);
            result.row(["collection1\0", "COLLECTION\0"]);
            result.row(["table\0", "TABLE\0"]);
            result.row(["collection2\0", "COLLECTION\0"]);
            result.finalize();

            return promise.should.eventually.deep.equal({
                collection1: schema.getCollection("collection1"),
                collection2: schema.getCollection("collection2")
            });
        });
        it('should return an list of collections, which can be used as table', function () {
            const promise = schema.getCollections();

            const result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "name"
            },{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "type"
            }]);
            result.row(["collection1\0", "COLLECTION\0"]);
            result.row(["table\0", "TABLE\0"]);
            result.row(["collection2\0", "COLLECTION\0"]);
            result.finalize();

            return promise.then(collections => {
                let retval = {};
                for (var k in collections) {
                    retval[k] = schema.getCollectionAsTable(k);
                }
                return retval;
            }).should.eventually.deep.equal({
                collection1: schema.getTable("collection1"),
                collection2: schema.getTable("collection2")
            });
        });
        it('should return a newly created collection', function () {
            const promise = schema.createCollection("newcollection"),
                result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.finalize();

            return promise.should.eventually.deep.equal(
                schema.getCollection("newcollection")
            );
        });
        it('should fail on error to create', function () {
            const promise = schema.createCollection("newcollection");
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });

        it('should return true for good drop collection', function () {
            const promise = schema.dropCollection("foo");
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.equal(true);
        });
        it('should fail for bad drop collection', function () {
            const promise = schema.dropCollection("foo");
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });



        it('should return an empty list for no table', function () {
            const promise = schema.getTables();

            const result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "name"
            }]);
            result.finalize();

            return promise.should.eventually.deep.equal({});
        });
        it('should return an list of tables', function () {
            const promise = schema.getTables();

            const result = new Server.ResultSet(data => session._client.handleNetworkFragment(data));
            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "name"
            },{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                name: "type"
            }]);
            result.row(["table1\0", "TABLE\0"]);
            result.row(["collection\0", "COLLECTION\0"]);
            result.row(["table2\0", "TABLE\0"]);
            result.finalize();

            return promise.should.eventually.deep.equal({
                table1: schema.getTable("table1"),
                table2: schema.getTable("table2")
            });
        });

        it('should return true for good drop table', function () {
            const promise = schema.dropTable("foo");
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.equal(true);
        });
        it('should fail for bad drop table', function () {
            const promise = schema.dropTable("foo");
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
        it('should hide internals from inspect output', function () {
            schema.inspect().should.deep.equal({ schema: "schema" });
        });
    });
});
