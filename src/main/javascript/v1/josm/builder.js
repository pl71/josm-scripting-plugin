/**
 * Collection of builders for creating OSM nodes, ways and relations.
 *
 * @module josm/builder
 */

// -- imports
var Node              = org.openstreetmap.josm.data.osm.Node;
var Way               = org.openstreetmap.josm.data.osm.Way;
var Relation          = org.openstreetmap.josm.data.osm.Relation;
var RelationMember    = org.openstreetmap.josm.data.osm.RelationMember;
var DataSet           = org.openstreetmap.josm.data.osm.DataSet;
var OsmPrimitiveType  = org.openstreetmap.josm.data.osm.OsmPrimitiveType;
var OsmPrimitive      = org.openstreetmap.josm.data.osm.OsmPrimitive;
var SimplePrimitiveId = org.openstreetmap.josm.data.osm.SimplePrimitiveId;
var LatLon            = org.openstreetmap.josm.data.coor.LatLon;
var List              = java.util.List;

var util = require("josm/util");

function assertGlobalId(id) {
    util.assertSomething(id, "Expected a defined, non-null object id, got {0}",
        id);
    util.assertNumber(id, "Expected a number as object id, got {0}", id);
    util.assert(id > 0, "Expected a positive id, got {0}", id);
};

function rememberId(builder, id, version){
    assertGlobalId(id);
    builder.id = id;
    version = util.isDef(version) ? version: 1;
    util.assertNumber(version, "Expected a number for 'version', got {0}",
        version);
    util.assert(version > 0,
        "Expected a positive number for 'version', got {0}", version);
    builder.version = version;
};

function rememberTags(builder, tags) {
    if (util.isNothing(tags)) return;
    util.assert(typeof tags === "object",
        "Expected a hash with tags, got {0}", tags);
    builder.tags = builder.tags || {};
    for (var name in tags) {
        if (! tags.hasOwnProperty(name)) break;
        var value = tags[name];
        name = util.trim(name);
        if (util.isNothing(value)) break;
        value = value + ""; // convert to string
        builder.tags[name] = value;
    }
}

function assignTags(primitive, tags) {
    for (var name in tags) {
        if (!tags.hasOwnProperty(name)) continue;
        var value = tags[name];
        if (util.isNothing(value)) continue;
        value = value + "";
        primitive.put(name, value);
    }
};

function rememberIdFromObject(builder, args) {
    if (! args.hasOwnProperty("id")) return;
    var o = args["id"];
    util.assert(util.isSomething(o),
        "''{0}'': must not be null or undefined", "id");
    util.assert(util.isNumber(o),
        "''{0}'': expected a number, got {1}", "id", o);
    util.assert(o > 0,
        "''{0}'': expected a number > 0, got {1}", "id", o);
    builder.id = o;
}

function rememberVersionFromObject(builder, args) {
    if (!args.hasOwnProperty("version")) return;
    var o = args["version"];
    util.assert(util.isSomething(o),
        "''{0}'': must not be null or undefined", "version");
    util.assert(util.isNumber(o),
        "''{0}'': expected a number, got {1}", "version", o);
    util.assert(o > 0,
        "''{0}'': expected a number > 0, got {1}", "version", o);
    builder.version = o;
}

function rememberPosFromObject(builder, args) {
    if (args.hasOwnProperty("pos")) {
        util.assert(! (args.hasOwnProperty("lat")
                || args.hasOwnProperty("lon")),
            "Can''t process both properties ''pos'' and ''lat''/''lon''");
        var pos = args["pos"];
        util.assert(util.isSomething(pos),
            "''{0}'': must not be null or undefined", "pos");
        if (pos instanceof LatLon) {
            builder.lat = pos.lat();
            builder.lon = pos.lon();
        } else if (util.isArray(pos)) {
            util.assert(pos.length == 2,
                "''{0}'': expected exactly two numbers in array", "pos");
            try {
                builder.lat = checkLat(pos[0]);
            } catch(e) {
                util.assert(false, "''{0}'': {1}", "lat", e);
            }
            try {
                builder.lon = checkLon(pos[1]);
            } catch(e) {
                util.assert(false, "''{0}'': {1}", "lon", e);
            }
        } else if (util.isObject(pos)) {
            util.assert(pos.hasOwnProperty("lat"),
                "''{0}'': missing mandatory property ''lat''", "pos");
            util.assert(pos.hasOwnProperty("lon"),
                "''{0}'': missing mandatory property ''lon''", "pos");
            try {
                builder.lat = checkLat(pos["lat"]);
            } catch(e) {
                util.assert(false, "''{0}'': {1}", "pos", e);
            }
            try {
                builder.lon = checkLon(pos["lon"]);
            } catch(e) {
                util.assert(false, "''{0}'': {1}", "pos", e);
            }
        }
    }
    if (args.hasOwnProperty("lat")) {
        var o = args["lat"];
        util.assert(util.isSomething(o),
            "''{0}'': must not be null or undefined", "lat");
        util.assert(util.isNumber(o),
            "''{0}'': expected a number, got {1}", "lat", o);
        util.assert(LatLon.isValidLat(o),
            "''{0}'': expected a valid latitude, got {1}", "lat", o);
        builder.lat = o;
    }
    if (args.hasOwnProperty("lon")) {
        var o = args["lon"];
        util.assert(util.isSomething(o),
            "''{0}'': must not be null or undefined", "lon");
        util.assert(util.isNumber(o),
            "''{0}'': expected a number, got {1}", "lon", o);
        util.assert(LatLon.isValidLon(o),
            "''{0}'': expected a valid longitude, got {1}", "lon", o);
        builder.lon = o;
    }
}

function rememberTagsFromObject(builder, args) {
    if (! args.hasOwnProperty("tags")) return;
    var o = args["tags"];
    if (util.isNothing(o)) return;
    rememberTags(builder, o);
}

// ----------------------------------------------------------------------------
// NodeBuilder
//-----------------------------------------------------------------------------
(function() {    // start submodul NodeBuilder

/**
 * Creates a new node builder.
 * 
 * NodeBuilder helps to create OSM nodes.
 *
 * Methods of NodeBuilder can be used in a static and in an instance context.
 * It isn't necessary to create an instance of NodeBuilder, unless it is
 * configured with a {@class org.openstreetmap.josm.data.osm.DataSet},
 * which created nodes are added to.
 *
 * @example
 *  var NodeBuilder = require("josm/builder").NodeBuilder;
 *  var DataSet = org.openstreetmap.josm.data.osm.DataSet;
 *
 *  var ds = new DataSet();
 *  // create a node builder without and underlying dataset ...
 *  var nbuilder = new NodeBuilder();
 *  // ... with an underlying dataset ....
 *  nbuilder =  new NodeBuilder(ds);
 *  // ... or using this factory method
 *  nbuilder = NodeBuilder.forDataSet(ds);
 *
 *  // create a new local node at position (0,0) without tags
 *  var n1 = nbuilder.create();
 *
 *  // create a new global node at a specific position with tags
 *  var n2 = nbuilder.withPosition(1,1).withTags({name: 'test'}).create(123456);
 *
 *  // create a new proxy for a global node
 *  // (an "incomplete" node in JOSM terminology)
 *  var n3 = nbuilder.createProxy(123456);
 *
 *  @class
 *  @name NodeBuilder
 *  @param {org.openstreetmap.josm.data.osm.DataSet} [ds]  the dataset
 *      which created objects are added to
 */
exports.NodeBuilder = function(ds) {
    if (util.isSomething(ds)) {
        util.assert(ds instanceof DataSet,
            "Expected a JOSM dataset, got {0}", ds);
        this.ds = ds;
    }
};

/**
 * Creates or configures a NodeBuilder which will add created nodes
 * to the dataset <code>ds</code>.
 *
 * @example
 * var builder = require("josm/builder");
 *
 * // create a new node builder building to a data set
 * var ds = new org.openstreetmap.josm.data.osm.DataSet();
 * var nb = builder.NodeBuilder.forDataSet(ds);
 *
 * // configure an existing node builder
 * var nb = new builder.NodeBuilder();
 * nb = nb.forDataSet(ds);
 *
 * @returns {module:josm/builder.NodeBuilder} the node builder
 * @param {org.openstreetmap.josm.data.osm.DataSet} ds the dataset which
 *         created objects are added to
 * @summary Creates a new NodeBuilder for a specific
 *         {@class org.openstreetmap.josm.data.osm.DataSet}.
 * @function
 * @memberof module:josm/builder~NodeBuilder
 */
exports.NodeBuilder.prototype.forDataSet 
    = exports.NodeBuilder.forDataSet 
    = function (ds) {
    var builder = receiver(this);
    util.assert(util.isSomething(ds),
        "Expected a non-null defined object, got {0}", ds);
    util.assert(ds instanceof DataSet, "Expected a JOSM dataset, got {0}", ds);
    builder.ds = ds;
    return builder;
};


function receiver(that) {
    return typeof that === "object" ? that : new exports.NodeBuilder();
}

function checkLat(value) {
    if (! util.isSomething(value)) throw "lat must not be null or undefined";
    if (! util.isNumber(value)) throw "lat must be a number";
    if (! LatLon.isValidLat(value)) throw "lat must be a valid latitude";
    return value;
}
function checkLon(value) {
    if (! util.isSomething(value)) throw "lon must not be null or undefined";
    if (! util.isNumber(value)) throw "lon must be a number";
    if (! LatLon.isValidLon(value)) throw "lon must be a valid longitude";
    return value;
}

function initFromObject(builder, args) {
    rememberIdFromObject(builder, args);
    rememberVersionFromObject(builder,args);
    rememberPosFromObject(builder, args);
    rememberTagsFromObject(builder, args);
}

/**
 * Creates a new  {@class org.openstreetmap.josm.data.osm.Node}.
 *
 * Can be used in an instance or in a static context..
 *
 * <strong>Optional named arguments in the parameters <code>args</code>
 * </strong>
 * <ul>
 *   <li><code>version</code> - the version of a global node (number > 0)</li>
 *   <li><code>lat</code> - a valide latitude (number in the range
 *       [-90,90])</li>
 *   <li><code>lon</code> - a valide longitude (number in the range
 *       [-180,180])</li>
 *   <li><code>pos</code> - either an array <code>[lat,lon]</code>,
 *       an object <code>{lat: ..., lon: ...}</code>,
 *   or an instance of {@class org.openstreetmap.josm.data.coor.LatLon}</li>
 *   <li><code>tags</code> - an object with tags. Null values and undefined
 *       values are ignored. Any other value is converted to a string.
 *       Leading and trailing white space in keys is removed.</li>
 * </ul>
 *
 *
 * @example
 * var nb = require("josm/builder").NodeBuilder
 * // create a new local node at position [0,0]
 * var n1 = nb.create();
 *
 * // create a new global node at position [0,0]
 * var n2 = nb.create(12345);
 *
 * // create a new global way with version 3 at a specific position
 * // and with some tags
 * var n3 = nb.create(12345, {version: 3, lat: 23.45,
 *     lon: 87.23, tags: {amenity: "restaurant"}
 * });
 *
 * @param {number} [id]  a global node id. If missing and
 *     not set before using <code>withId(..)</code>, creates a new local id.
 * @param {object} [options] additional options for creating the node
 * @returns {org.openstreetmap.josm.data.osm.Node}  the created node
 * @summary Creates a new  {@class org.openstreetmap.josm.data.osm.Node}
 * @function
 * @name create
 * @memberof module:josm/builder~NodeBuilder
 */
exports.NodeBuilder.create 
    = exports.NodeBuilder.prototype.create 
    = function () {
        var builder = receiver(this);
        var arg;
        
        switch(arguments.length){
        case 0:
            break;
        case 1:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            if (util.isNumber(arg)) {
                util.assert(arg > 0,
                    "Argument 0: expected an id > 0, got {0}", arg);
                builder.id = arg;
            } else if (typeof arg == "object") {
                initFromObject(builder, arg);
            } else {
                util.assert(false, "Argument 0: unexpected type, got ''{0}''", arg);
            }
            break;

        case 2:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            util.assert(util.isNumber(arg), "Argument 0: must be a number");
            util.assert(arg > 0, "Expected an id > 0, got {0}", arg);
            builder.id = arg;

            arg = arguments[1];
            if (util.isSomething(arg)) {
                util.assert(typeof arg === "object", "Argument 1: must be an object");
                initFromObject(builder, arg);
            }
            break;
        default:
            util.assert(false,
                "Unexpected number of arguments, got {0}", arguments.length);
        }

        var node;
        if (util.isNumber(builder.id)) {
            if (util.isNumber(builder.version)){
                node = new Node(builder.id, builder.version);
            } else {
                node = new Node(builder.id, 1);
            }
            var coor = new LatLon(builder.lat || 0, builder.lon || 0);
            node.setCoor(coor);
        } else {
            node = new Node(new LatLon(builder.lat || 0, builder.lon || 0));
        }
        assignTags(node, builder.tags || {});
        if (builder.ds) {
            if (builder.ds.getPrimitiveById(node) == null) {
                builder.ds.addPrimitive(node);
            } else {
                throw new Error(
                    "Failed to add primitive, primitive already included "
                        + "in dataset. \n"
                        + "primitive=" + node
                );
            }
        }
        return node;
    };

/**
 * Creates a new <em>proxy</em>
 * {@class org.openstreetmap.josm.data.osm.Node}. A proxy node is a node,
 * for which we only know its global id. In order to know more details
 * (position, tags, etc.), we would have to download it from the OSM server.
 * 
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var nbuilder = require("josm/builder").NodeBuilder;
 *
 * // a new proxy node for the global node with id 12345
 * var n1 = nbuilder.createProxy(12345);
 *
 * @param {number} id  the node id (not null, number > 0 expected)
 * @return {org.openstreetmap.josm.data.osm.Node} the new proxy node
 * @summary Creates a new <em>proxy</em> {@class org.openstreetmap.josm.data.osm.Node}
 * @function
 * @name createProxy
 * @memberof module:josm/builder~NodeBuilder
 */
exports.NodeBuilder.prototype.createProxy
    = exports.NodeBuilder.createProxy
    = function createProxy(id) {
        var builder = receiver(this);
        util.assert(util.isSomething(id),
            "Argument 0: must not be null or undefined");
        util.assert(util.isNumber(id),
            "Argument 0: expected a number, got {0}", id);
        util.assert(id > 0, "Argument 0: id > 0 expected, got {0}", id);
    
        var node = new Node(id);
        if (builder.ds)  builder.ds.addPrimitive(node);
        return node;
    };

/**
 * Declares the node position.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var nbuilder = require("josm/builder").NodeBuilder;
 *
 * // a new global  node with the global id 12345 at position (34,45)
 * var n1 = nbuilder.withPosition(34,45).create(12345);
 *
 * // a new local node at position (23.2, 87.33)
 * var n2 = nbuilder.withPosition(23.3,87.33).create();
 *
 * @param {Number} lat  the latitude. A number in the range [-90..90].
 * @param {Number} lon the longitude. A number in the range [-180..180].
 * @returns {module:josm/builder~NodeBuilder} a node builder (for method chaining)
 * @summary Declares the node position.
 * @function
 * @memberof module:josm/builder~NodeBuilder
 * @name withPosition
 */
exports.NodeBuilder.prototype.withPosition
    = exports.NodeBuilder.withPosition
    = function (lat, lon){
        var builder = receiver(this);
        util.assert(util.isNumber(lat), "Expected a number for lat, got {0}", lat);
        util.assert(util.isNumber(lon), "Expected a number for lon, got {0}", lon);
        util.assert(LatLon.isValidLat(lat), "Invalid lat, got {0}", lat);
        util.assert(LatLon.isValidLon(lon), "Invalid lon, got {0}", lon);
        builder.lat = lat;
        builder.lon = lon;
        return builder;
    };

/**
 * Declares the tags to be assigned to the new node.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var nbuilder = require("josm/builder").NodeBuilder;
 * // a new global  node with the global id 12345 and tags name=test and
 * // highway=road
 * var n1 = nbuilder.withTags({"name":"test", "highway":"road"}).global(12345);
 *
 * // a new local node tags name=test and highway=road
 * var tags = {
 *      "name"    : "test",
 *      "highway" : "road"
 * };
 * var n2 = nbuilder.withTags(tags).local();
 *
 * @param {object} [tags]  the tags
 * @returns {module:josm/builder~NodeBuilder} the node builder (for method chaining)
 * @summary Declares the node tags.
 * @function
 * @memberof module:josm/builder~NodeBuilder
 * @name withTags
 */
exports.NodeBuilder.prototype.withTags 
    = exports.NodeBuilder.withTags 
    = function (tags) {
        var builder = typeof this === "object" ? this : new exports.NodeBuilder();
        rememberTags(builder, tags);
        return builder;
    };

/**
 * Declares the global node id and the global node version.
 *
 * The method can be used in a static and in an instance context.
 *
 * @param {number} id  (mandatory) the global node id. A number > 0.
 * @param {number} version (optional) the global node version. If present,
 *     a number > 0. If missing,
 * the version 1 is assumed.
 * @returns {module:josm/builder~NodeBuilder} the node builder (for method chaining)
 * @summary Declares the node id and version.
 * @function
 * @memberof module:josm/builder~NodeBuilder
 * @name withId
 */
exports.NodeBuilder.prototype.withId 
    = exports.NodeBuilder.withId 
    = function withId(id, version) {
        var builder = typeof this === "object" ? this : new exports.NodeBuilder();
        rememberId(builder, id, version);
        return builder;
    };

}());  // end submodul NodeBuilder

//-----------------------------------------------------------------------------
// WayBuilder
//-----------------------------------------------------------------------------
(function(){    // start submodul WayBuilder

var receiver = function(that) {
    return typeof that === "object" ? that : new exports.WayBuilder();
};

/**
 * Creates a new builder for OSM ways
 *
 * WayBuilder helps to create OSM
 * {@class org.openstreetmap.josm.data.osm.Way}s.
 *
 * Methods of WayBuilder can be used in a static and in an instance context.
 * It isn't necessary to create an instance of WayBuilder, unless it is
 * configured with a {@class org.openstreetmap.josm.data.osm.DataSet},
 * which created ways are added to.
 * @example
 *  var WayBuilder = require("josm/builder").WayBuilder;
 *  var DataSet = org.openstreetmap.josm.data.osm.DataSet;
 *
 *  var ds = new DataSet();
 *  // create a way builder without and underlying dataset ...
 *  var wbuilder = new WayBuilder();
 *  // ... with an underlying dataset ....
 *  wbuilder =  new WayBuilder(ds);
 *  // ... or using this factory method
 *  wbuilder = WayBuilder.forDataSet(ds);
 *
 *  // create a new local way
 *  var w1 = wbuilder.create();
 *
 *  // create a new global way
 *  var w2 = wbuilder.withTags({highway: 'residential'}).create(123456);
 *
 *  // create a new proxy for a global way
 *  // (an "incomplete" node in JOSM terminology)
 *  var w3 = wbuilder.createProxy(123456);
 * 
 * @class
 * @param {org.openstreetmap.josm.data.osm.DataSet} [ds]  a JOSM
 *    dataset which created ways are added to. If missing, the created ways
 *    aren't added to a dataset.
 * @name WayBuilder
 */
exports.WayBuilder = function(ds) {
    if (util.isSomething(ds)) {
        util.assert(ds instanceof DataSet, "Expected a DataSet, got {0}", ds);
        this.ds = ds;
    }
    this.nodes = [];
};

/**
 * Creates or configures a WayBuilder which will add created nodes
 * to the dataset <code>ds</code>.
 *
 * @example
 * var builder = require("josm/builder");
 *
 * // create a new way builder building to a data set
 * var ds = new org.openstreetmap.josm.data.osm.DataSet();
 * var wb = builder.WayBuilder.forDataSet(ds);
 *
 * // configure an existing way builder
 * var wb = new builder.WayBuilder();
 * nb = wb.forDataSet(ds);
 *
 * @return {module:josm/builder~WayBuilder} the way builder
 * @param {org.openstreetmap.josm.data.osm.DataSet} ds the dataset which
 *         created objects are added to
 * @summary Creates a new WayBuilder with an underlying dataset.
 * @function
 * @name forDataSet
 * @memberof module:josm/builder~WayBuilder
 * @name forDataSet
 */
exports.WayBuilder.prototype.forDataSet 
    = exports.WayBuilder.forDataSet 
    = function (ds) {
        var builder = receiver(this);
        util.assert(util.isSomething(ds),
            "Expected a non-null defined object, got {0}", ds);
        util.assert(ds instanceof DataSet, "Expected a JOSM dataset, got {0}", ds);
        builder.ds = ds;
        return builder;
    };

/**
 * Declares the global way id and the global way version.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 *  var wbuilder = require("josm/builder").WayBuilder;
 *  // creates a global way with id 12345 an version 12
 *  var w = wbuilder.withId(12345, 12).create();
 *
 * @param {number} id  (mandatory) the global way id. A number > 0.
 * @param {number} [version] the global way version. If present,
 *    a number > 0. If missing, the version 1 is assumed.
 * @return {module:josm/builder~WayBuilder} the way builder (for method chaining)
 * @summary Declares the global way id and the global way version.
 * @function
 * @memberof module:josm/builder~WayBuilder
 * @name withId
 */
exports.WayBuilder.prototype.withId 
    = exports.WayBuilder.withId 
    = function (id, version) {
        var builder = receiver(this);
        rememberId(builder, id, version);
        return builder;
    };

/**
 * Declares the tags to be assigned to the new way.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var wbuilder = require("josm/builder").WayBuilder;
 * // a new global way with the global id 12345 and tags name="Laubeggstrasse"
 * // and highway=residential
 * var n1 = wbuilder.withTags({name:"Laubeggstrasse", highway:"residential"})
 *     .create(12345);
 *
 * // a new local node tags name=test and highway=road
 * var tags = {
 *      name    : "Laubeggstrasse",
 *      highway : "residential"
 * };
 * var n2 = wbuilder.withTags(tags).create();
 *
 * @param {object} [tags] the tags
 * @return {module:josm/builder~WayBuilder} the way builder (for method chaining)
 * @summary Declares the tags to be assigned to the new way.
 * @function
 * @memberof module:josm/builder~WayBuilder
 * @name withTags
 */
exports.WayBuilder.prototype.withTags 
    = exports.WayBuilder.withTags 
    = function (tags) {
        var builder = receiver(this);
        rememberTags(builder, tags);
        return builder;
    };

/**
 * Declares the nodes of the way.
 *
 * Accepts either a vararg list of
 * {@class org.openstreetmap.josm.data.osm.Node},
 * an array of {@class org.openstreetmap.josm.data.osm.Node}s or a Java list
 * of {@class org.openstreetmap.josm.data.osm.Node}s. At least <strong>two
 * non-identical nodes</strong> have to be supplied.
 * The same node can occure more than once in the list, but a consecutive
 * sequence of the same node is collapsed to one node.
 * 
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var wbuilder = require("josm/builder").WayBuilder;
 * var nbuilder = require("josm/builder").NodeBuilder;
 * // creates a new local way with two local nodes
 * var way = builder.withNodes(
 *    nbuilder.create(), nbuilder.create()
 * ).create();
 *
 * @param nodes  the list of nodes. See description and examples.
 * @return {module:josm/builder~WayBuilder} the way builder (for method chaining)
 * @summary Declares the nodes of the way.
 * @function
 * @memberof module:josm/builder~WayBuilder
 * @name withNodes
 */
exports.WayBuilder.withNodes 
    = exports.WayBuilder.prototype.withNodes 
    = function () {
        var builder = receiver(this);
        var nodes;
        switch(arguments.length) {
        case 0: return builder;
        case 1:
            nodes = arguments[0];
            if (util.isNothing(nodes)) return builder;
            if (nodes instanceof Node) {
                nodes = [nodes];
            } else if (util.isArray(nodes)) {
                // OK
            } else if (nodes instanceof List) {
                var temp = [];
                for(var it = nodes.iterator(); it.hasNext();) temp.push(it.next());
                nodes = temp;
            } else {
                util.assert(false,
                    "Argument 0: expected a Node or a list of nodes, got {0}",
                    nodes);
            }
            break;
        default:
            nodes = Array.prototype.slice.call(arguments,0);
            break;
        }
        var newnodes = [];
        var last;
        for (var i=0; i < nodes.length; i++) {
            var n = nodes[i];
            if (util.isNothing(n)) continue;
            util.assert(n instanceof Node,
                "Expected instances of Node only, got {0} at index {1}", n, i);
            // skip sequence of identical nodes
            if (last && last.id == n.id) continue;
            newnodes.push(n);
            last = n;
        }
        builder.nodes = newnodes;
        return builder;
    };

/**
 * Creates a new <em>proxy</em> way. A proxy way is a way, for which we
 * only know its global id. In order to know more details (nodes, tags, etc.),
 * we would have to download it from the OSM server.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var wbuilder = require("josm/builder").WayBuilder;
 *
 * // a new proxy way for the global way with id 12345
 * var w1 = wbuilder.createProxy(12345);
 *
 * @return {org.openstreetmap.josm.data.osm.Way} the new proxy way
 * @summary Creates a new proxy way
 * @function
 * @memberof module:josm/builder~WayBuilder
 * @name createProxy
 */
exports.WayBuilder.createProxy
    = exports.WayBuilder.prototype.createProxy
    = function (id) {
        var builder = receiver(this);
        if (util.isDef(id)) {
            util.assert(util.isNumber(id) && id > 0,
                "Expected a number > 0, got {0}", id);
            builder.id = id;
        }
        util.assert(util.isNumber(builder.id),
            "way id is not a number. Use .createProxy(id) or "
           + ".withId(id).createProxy()");
    
        util.assert(builder.id > 0, "Expected way id > 0, got {0}", builder.id);
        var way = new Way(builder.id);
        if (builder.ds) builder.ds.addPrimitive(way);
        return way;
    };


function assignWayAttributes(builder, way) {
    if (util.hasProperties(builder.tags)) {
        assignTags(way, builder.tags);
    }
    if (builder.nodes.length > 0) {
        way.setNodes(builder.nodes);
    }
};

function rememberNodesFromObject(builder, args) {
    if (!args.hasOwnProperty("nodes")) return;
    var o = args["nodes"];
    if (! util.isSomething(o)) return;
    util.assert(util.isArray(o) || o instanceof List,
        "Expected an array or an instance of java.util.List, got {0}", o);
    builder.withNodes(o);
}

function initFromObject(builder, args) {
    rememberIdFromObject(builder, args);
    rememberVersionFromObject(builder,args);
    rememberTagsFromObject(builder, args);
    rememberNodesFromObject(builder, args);
}

/**
 * Creates a new way.
 *
 * Can be used in an instance or in a static context.
 *
 * Optional named arguments in the parameters <code>options</code>:
 * <dl>
 *   <dt><code class="signature">id</code>:number</dt>
 *   <dd>the id of a global way (number > 0)</dd>
 *
 *   <dt><code class="signature">version</code>:number</dt>
 *   <dd>the version of a global way (number > 0)</dd>
 *
 *   <dt><code class="signature">nodes</code>:array|list</dt>
 *   <dd>an array or a list of nodes</dd>
 *
 *   <dt><code class="signature">tags</code>:object</dt>
 *   <dd>an object with tags. Null values and undefined values are ignored.
 *   Any other value is converted to a string. Leading and trailing white
 *   space in keys is removed.</dd>
 * </dl>
 *
 * @example
 * var wb = require("josm/builder").WayBuilder
 * // create a new local way
 * var w1 = wb.create();
 *
 * // create a new global way
 * var w2 = wb.create(12345);
 *
 * // create a new global way with version 3 at a specific position and with
 * // some tags
 * var w3 = wb.create(12345, {
 *    version: 3,
 *    tags: {amenity: "restaurant"},
 *    nodes: [n1,n2,n3]
 *  });
 *
 * @param {number}  [id]  a global way id. If missing and not set
 *    before using <code>withId(..)</code>, creates a new local id.
 * @param {object} [options]  additional parameters for creating the way
 * @returns {org.openstreetmap.josm.data.osm.Way} the created way
 * @summary Creates a new way
 * @function
 * @memberof module:josm/builder~WayBuilder
 * @name create
 */
exports.WayBuilder.create 
    = exports.WayBuilder.prototype.create 
    = function create() {
        var builder = receiver(this);
        var arg;
        switch(arguments.length){
        case 0:
            break;
        case 1:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            if (util.isNumber(arg)) {
                util.assert(arg > 0,
                    "Argument 0: expected an id > 0, got {0}", arg);
                builder.id = arg;
            } else if (typeof arg == "object") {
                initFromObject(builder, arg);
            } else {
                util.assert(false,
                    "Argument 0: unexpected type, got ''{0}''", arg);
            }
            break;

        case 2:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            util.assert(util.isNumber(arg), "Argument 0: must be a number");
            util.assert(arg > 0, "Expected an id > 0, got {0}", arg);
            builder.id = arg;

            arg = arguments[1];
            if (util.isSomething(arg)) {
                util.assert(typeof arg === "object",
                    "Argument 1: must be an object");
                initFromObject(builder, arg);
            }
            break;
        default:
            util.assert(false, "Unexpected number of arguments, got {0}",
                arguments.length);
        }

        var way;
        if (util.isNumber(builder.id)) {
            if (util.isNumber(builder.version)){
                way = new Way(builder.id, builder.version);
            } else {
                way = new Way(builder.id, 1);
            }
        } else {
            way = new Way(0); // creates a new local way
        }
        assignTags(way, builder.tags || {});
        if (builder.nodes && builder.nodes.length > 0) {
            way.setNodes(builder.nodes);
        }
        if (builder.ds) {
            if (builder.ds.getPrimitiveById(way) == null) {
                builder.ds.addPrimitive(way);
            } else {
                throw new Error(
                    "Failed to add primitive, primitive already included "
                        + "in dataset. \n"
                        + "primitive=" + way
                );
            }
        }
        return way;
    };

}()); // end submodul WayBuilder

//-----------------------------------------------------------------------------
// RelationBuilder
//-----------------------------------------------------------------------------
(function() { // start submodul Relation Buildee

var receiver = function(that) {
    return typeof that === "object" ? that : new exports.RelationBuilder();
};

/**
 * Creates a new builder for OSM relations
 * 
 * RelationBuilder helps to create OSM
 * {@class org.openstreetmap.josm.data.osm.Relation}s.
 *
 * Methods of RelationBuilder can be used in a static and in an instance
 * context.
 * It isn't necessary to create an instance of RelationBuilder, unless it is
 * configured with a {@class org.openstreetmap.josm.data.osm.DataSet},
 * which created ways are added to.
 * @example
 * var RelationBuilder = require("josm/builder").RelationBuilder;
 * var DataSet = org.openstreetmap.josm.data.osm.DataSet;
 *
 * var ds = new DataSet();
 * // create a relation builder without and underlying dataset ...
 * var rbuilder = new RelationBuilder();
 * // ... with an underlying dataset ...
 * rbuilder =  new RelationBuilder(ds);
 * // ... or using this factory method
 * rbuilder = RelationBuilder.forDataSet(ds);
 *
 * // create a new local relation
 * var r1 = rbuilder.create();
 *
 * // create a new global way
 * var r2 = rbuilder.withTags({route: 'bicycle'}).create(123456);
 *
 * // create a new proxy for a global relation
 * // (an "incomplete" node in JOSM terminology)
 * var r3 = rbuilder.createProxy(123456);
 *
 * @class
 * @param {org.openstreetmap.josm.data.osm.DataSet} ds (optional) a JOSM
 *     dataset which created ways are added to. If missing, the created ways
 *     aren't added to a dataset.
 * @name RelationBuilder
 */
exports.RelationBuilder = function(ds) {
    if (util.isSomething(ds)) {
        util.assert(ds instanceof DataSet, "Expected a DataSet, got {0}", ds);
        this.ds = ds;
    }  
    this.members = [];
};

/**
 * Creates or configures a RelationBuilder which will add created nodes
 * to the dataset <code>ds</code>.
 *
 * @example
 * var builder = require("josm/builder");
 *
 * // create a new relation builder building to a data set
 * var ds = new org.openstreetmap.josm.data.osm.DataSet();
 * var rb = builder.RelationBuilder.forDataSet(ds);
 *
 * // configure an existing relation builder
 * var wb = new builder.RelationBuilder();
 * nb = wb.forDataSet(ds);
 *
 * @return {module:josm/builder.RelationBuilder} the relation builder
 * @summary Creates a new RelationBuilder which adds created relations to a
 *     dataset
 * @param {org.openstreetmap.josm.data.osm.DataSet} ds  a JOSM
 *     dataset which created ways are added to.
 * @function
 * @name forDataSet
 * @memberof module:josm/builder~RelationBuilder
 */
exports.RelationBuilder.prototype.forDataSet 
    = exports.RelationBuilder.forDataSet 
    = function (ds) {
        var builder = receiver(this);
        util.assert(util.isSomething(ds),
            "Expected a non-null defined object, got {0}", ds);
        util.assert(ds instanceof DataSet, "Expected a JOSM dataset, got {0}", ds);
        builder.ds = ds;
        return builder;
    };

/**
 * Create a RelationMember
 *
 * <dl>
 *   <dt>member(role, obj)</dt>
 *   <dd>Create a relation member with role <var>role</var> and member object
 *   <var>obj</var>. <var>role</var> can be null or undefined, obj must neither
 *   be null nor undefinde. <var>role</var> is a string, <var>obj</var> is an
 *   OSM node, a way, or a relation.
 *   </dd>
 *   <dt>member(obj)</dt>
 *  <dd>Create a relation member for the member object <var>obj</var>.
 *   <var>obj</var> must neither be null nor undefinde. <var>obj</var> is an
 *   OSM node, a way, or a relation. The created relation member has no role.
 *   </dd>
 * </dl>
 *
 * @example
 * var member = require("josm/builder").RelationBuilder.member;
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // create a new RelationMember with role 'house' for a new node
 * var m1 = member("house", nb.create());
 * // create a new RelationMember with an empty role for a new node
 * var m2 = member(nb.create());
 *
 * @static
 * @returns {org.openstreetmap.josm.data.osm.RelationMember}  the relation member
 * @summary Utility function - creates a relation member
 * @memberof module:josm/builder~RelationBuilder
 * @name member
 * @function
 * @param {string} [role] the member role
 * @param {primitive} primitive the member primitive
 */

exports.RelationBuilder.member = function () {
    function normalizeObj(obj) {
        util.assert(util.isSomething(obj),
            "obj: must not be null or undefined");
        util.assert(obj instanceof OsmPrimitive,
            "obj: expected an OsmPrimitive, got {0}", obj);
        return obj;
    }
    function normalizeRole(role) {
        if (util.isNothing(role)) return null;
        util.assert(util.isString(role),
            "role: expected a string, got {0}", role);
        return role;
    }
    switch(arguments.length) {
    case 0: util.assert(false,
        "Expected arguments (object) or (role, object), got 0 arguments");
    case 1:
        var obj = normalizeObj(arguments[0]);
        return new RelationMember(null /* no role */, obj);
    case 2:
        var role = normalizeRole(arguments[0]);
        var obj = normalizeObj(arguments[1]);
        return new RelationMember(role, obj);
    default:
        util.assert(false,
            "Expected arguments (object) or (role, object), got {0} arguments",
            arguments.length);
    }
};

/**
 * Declares the global relation id and the global relation version.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 *  var rbuilder = require("josm/builder").RelationBuilder;
 *  // creates a global relation with id 12345 an version 12
 *  var r = rbuilder.withId(12345, 12).create();
 *
 * @param {number} id  (mandatory) the global relation id. A number > 0.
 * @param {number} version  (optional) the global relation version. If present,
 *    a number > 0. If missing, the version 1 is assumed.
 * @returns {module:josm/builder~RelationBuilder} the relation builder (for method chaining)
 * @summary Declares the relation id and version.
 * @memberof module:josm/builder~RelationBuilder
 * @name withId
 * @function
 * @instance
 */
exports.RelationBuilder.prototype.withId 
    = exports.RelationBuilder.withId 
    = function (id, version) {
        var builder = receiver(this);
        rememberId(builder, id, version);
        return builder;
    };

/**
 * Declares the tags to be assigned to the new relation.
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var rbuilder = require("josm/builder").RelationBuilder;
 * // a new global relation with the global id 12345 and tags route="bicycle"
 * //and name="n8"
 * var r1 = rbuilder.withTags({name:"n8", route:"bicycle"}).create(12345);
 *
 * // a new local node tags name=test and highway=road
 * var tags = {
 *      name    : "n8",
 *      route : "bicycle"
 * };
 * var r2 = rbuilder.withTags(tags).create();
 *
 * @param {object} [tags]  the tags
 * @returns {module:josm/builder~RelationBuilder} a relation builder (for method chaining)
 * @summary Declares the tags to be assigned to the new relation.
 * @memberof module:josm/builder~RelationBuilder
 * @name withTags
 * @function
 * @instance
 */
exports.RelationBuilder.prototype.withTags 
    = exports.RelationBuilder.withTags 
    = function (tags) {
        var builder = receiver(this);
        rememberTags(builder, tags);
        return builder;
    };

/**
 * Creates a new <em>proxy</em> relation. A proxy relation is a relation,
 * for which we only know its global id. In order to know more details
 * (members, tags, etc.), we would have to download it from the OSM server.
 * 
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var rbuilder = require("josm/builder").RelationBuilder;
 *
 * // a new proxy relation for the global way with id 12345
 * var r1 = rbuilder.createProxy(12345);
 * 
 * @returns {org.openstreetmap.josm.data.osm.Relation} the new proxy relation
 * @summary Creates a new <em>proxy</em> relation.
 * @memberof module:josm/builder~RelationBuilder
 * @function
 * @name createProxy
 * @instance
 * @param {number} id the id for the proxy relation
 */
exports.RelationBuilder.createProxy
    = exports.RelationBuilder.prototype.createProxy
    = function (id) {
        var builder = receiver(this);
        if (util.isDef(id)) {
            util.assert(util.isNumber(id) && id > 0,
                "Expected a number > 0, got {0}", id);
            builder.id = id;
        }
        util.assert(util.isNumber(builder.id),
            "way id is not a number. Use .createProxy(id) or "
        + ".withId(id).createProxy()");

        util.assert(builder.id > 0, "Expected id > 0, got {0}", builder.id);
        var relation = new Relation(builder.id);
        if (builder.ds) builder.ds.addPrimitive(relation);
        return relation;
    };

/**
 * Declares the members of a relation.
 *
 * Accepts either a vararg list of relation members, nodes, ways or
 * relations, an array of relation members, nodes ways or relations, or a
 * Java list of members, nodes, ways or relation.
 * 
 *
 * The method can be used in a static and in an instance context.
 *
 * @example
 * var rbuilder = require("josm/builder").RelationBuilder;
 * var nbuilder = require("josm/builder").NodeBuilder;
 * var wbuilder = require("josm/builder").WayBuilder;
 * var member = require("josm/builder").RelationBuilder.member;
 *
 * var r1 = rbuilder.withMembers(
 *   member("house", nbuilder.create()),
 *   member("house", nbuilder.create()),
 *   member("street", wbuilder.create())
 * ).create();
 *
 * @param nodes  the list of members. See description and examples.
 * @returns {module:josm/builder~RelationBuilder} the relation builder (for method chaining)
 * @summary Declares the members of a relation.
 * @memberof module:josm/builder~RelationBuilder
 * @function
 * @name withMembers
 * @instance
 */
exports.RelationBuilder.withMembers 
    = exports.RelationBuilder.prototype.withMembers
    = function () {
        var builder = receiver(this);
        var members = [];
        function remember(obj) {
            if (util.isNothing(obj)) return;
            if (obj instanceof OsmPrimitive) {
                members.push(new RelationMember(null, obj));
            } else if (obj instanceof RelationMember)  {
                members.push(obj);
            } else if (util.isArray(obj)) {
                for(var i=0; i < obj.length; i++) remember(obj[i]);
            } else if (obj instanceof List) {
                for(var it = obj.iterator(); it.hasNext();) remember(it.next());
            } else {
                util.assert(false,
                    "Can''t add object ''{0}'' as relation member", obj);
            }
        }
        for (var i=0; i < arguments.length; i++){
            remember(arguments[i]);
        }
        builder.members = members;
        return builder;
    };


function rememberMembersFromObject(builder, args) {
    if (!args.hasOwnProperty("members")) return;
    var o = args["members"];
    if (! util.isSomething(o)) return;
    util.assert(util.isArray(o) || o instanceof List,
        "members: Expected an array or an instance of java.util.List, got {0}",
        o);
    builder.withMembers(o);
};

function initFromObject(builder, args) {
    rememberIdFromObject(builder, args);
    rememberVersionFromObject(builder,args);
    rememberTagsFromObject(builder, args);
    rememberMembersFromObject(builder, args);
};

/**
 * Creates a new relation.
 *
 * Can be used in an instance or in a static context.
 *
 * <strong>Optional named arguments in the parameters <code>args</code>
 * </strong>
 * <ul>
 *   <li><var>id</var> - the id of a global relation (number > 0)</li>
 *   <li><var>version</var> - the version of a global relation (number > 0)
 *   </li>
 *   <li><var>members</var> - an array or a list of relation members, nodes,
 *   ways, or relation</li>
 *   <li><var>tags</var> - an object with tags. Null values and undefined
 *   values are ignored. Any other value
 *   is converted to a string. Leading and trailing white space in keys is
 *   removed.</li>
 * </ul>
 *
 *
 * @example
 * var rb = require("josm/builder").RelationBuilder
 * var nb = require("josm/builder").NodeBuilder
 * var member = rb.member;
 * // create a new local relation
 * var r1 = rb.create();
 *
 * // create a new global relation
 * var r2 = rb.create(12345);
 *
 * // create a new global relation with version 3 with some tags and two
 * // members
 * var r3 = rb.create(12345, {
 *    version: 3,
 *    tags: {type: "route"},
 *    members: [member('house', nb.create()), member(nb.create())]
 *  });
 *
 * @param {number}  [id]  a global way id. If missing and not set
 *     before using <code>withId(..)</code>, creates a new local id.
 * @param {object} [args]  additional parameters for creating the relation
 * @returns {org.openstreetmap.josm.data.osm.Relation} the relation
 * @summary Creates a new relation.
 * @memberof module:josm/builder~RelationBuilder
 * @function
 * @name create
 * @instance
 */
exports.RelationBuilder.create 
    = exports.RelationBuilder.prototype.create
    = function () {
        var builder = receiver(this);
        var arg;
        switch(arguments.length){
        case 0:
            break;
        case 1:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            if (util.isNumber(arg)) {
                util.assert(arg > 0, "Argument 0: expected an id > 0, got {0}", arg);
                builder.id = arg;
            } else if (typeof arg == "object") {
                initFromObject(builder, arg);
            } else {
                util.assert(false, "Argument 0: unexpected type, got ''{0}''", arg);
            }
            break;

        case 2:
            arg = arguments[0];
            util.assert(util.isSomething(arg),
                "Argument 0: must not be null or undefined");
            util.assert(util.isNumber(arg), "Argument 0: must be a number");
            util.assert(arg > 0,
                "Expected an id > 0, got {0}", arg);
            builder.id = arg;

            arg = arguments[1];
            if (util.isSomething(arg)) {
                util.assert(typeof arg === "object", "Argument 1: must be an object");
                initFromObject(builder, arg);
            }
            break;
        default:
            util.assert(false, "Unexpected number of arguments, got {0}",
                arguments.length);
        }

        var relation;
        if (util.isNumber(builder.id)) {
            if (util.isNumber(builder.version)){
                relation = new Relation(builder.id, builder.version);
            } else {
                relation = new Relation(builder.id, 1);
            }
        } else {
            relation = new Relation(0); // creates a new local reöatopm
        }
        assignTags(relation, builder.tags || {});
        if (builder.members && builder.members.length > 0) {
            relation.setMembers(builder.members);
        }
        if (builder.ds) {
            if (builder.ds.getPrimitiveById(relation) == null) {
                builder.ds.addPrimitive(relation);
            } else {
                throw new Error(
                    "Failed to add primitive, primitive already included "
                        + "in dataset. \n"
                        + "primitive=" + relation
                );
            }
        }
        return relation;
    };
}());  // end submodul Relation Builder
