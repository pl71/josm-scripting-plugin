/**
 * <p>This module is auto-loaded by the scripting plugin and mixed into the
 * native java class {@class org.openstreetmap.josm.data.osm.Node}.</p>
 *
 * @module josm/mixin/NodeMixin
 */
var util = require("josm/util");
var LatLon = org.openstreetmap.josm.data.coor.LatLon;

/**
 * <p>This mixin is auto-loaded by the scripting plugin and mixed into the
 * native java class {@class org.openstreetmap.josm.data.osm.Node}. It
 * provides additional properties and methods which you can invoke on an
 * instance of
 * {@class org.openstreetmap.josm.data.osm.Node}.</p>
 *
 * @mixin NodeMixin
 * @extends OsmPrimitiveMixin
 * @forClass org.openstreetmap.josm.data.osm.Node
 */
exports.mixin = {};
exports.forClass = org.openstreetmap.josm.data.osm.Node;

/**
 * <p>Get or set the node latitude.</p>
 *
 * <dl>
 *   <dt>get</dt>
 *   <dd>Replies the current latitude, or undefined, if the latitude isn't
 *   known.</dd>
 *
 *   <dt>set</dt>
 *   <dd>Assign the latitude. Expects a number in the range [-90,90].
 *   Raises an error, if the node is a proxy node.</dd>
 * </dl>
 *
 * @example
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // set members
 * var n = nb.create();
 * n.lat = 23.245;
 * n.lat;  // -> 23.245
 *
 * @memberOf module:josm/mixin/NodeMixin~NodeMixin
 * @name lat
 * @property {number} lat latitude
 * @summary Get or set the node latitude.
 * @instance
 */
exports.mixin.lat =  {
    get: function() {
        if (this.isIncomplete || this.getCoor() == null) return undefined;
        return this.getCoor().$lat();
    },
    set: function(lat) {
        util.assert(! this.isIncomplete,
            "Can't set lat on an incomplete node");
        util.assert(util.isNumber(lat), "Expected a number, got {0}", lat);
        util.assert(LatLon.isValidLat(lat),
            "Expected a valid lat in the range [-90,90], got {0}", lat);
        var oldlat = this.lat;
        var coor = this.getCoor();
        if (coor == null) coor = new LatLon(0,0);
        coor = new LatLon(lat, coor.$lon());
        this.setCoor(coor);
        if (oldlat != this.lat && !this.modified) this.modified = true;
    }
};

/**
 * <p>Get or set the node longitude.</p>
 *
 * <dl>
 *   <dt>get</dt>
 *   <dd>Replies the current longitude, or undefined, if the longitude isn't
 *   known.</dd>
 *
 *   <dt>set</dt>
 *   <dd>Assign the longitude. Expects a number in the range [-180,180].
 *   Raises an error, if the node is a proxy node.</dd>
 * </dl>
 *
 * @example
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // set members
 * var n = nb.create();
 * n.lon = -120.78;
 * n.lon;  // -> -120.78;
 *
 *
 * @memberOf module:josm/mixin/NodeMixin~NodeMixin
 * @name lon
 * @property {number} lon longitude 
 * @summary Get or set the node longitude.
 * @instance
 */
exports.mixin.lon = {
    get: function() {
        if (this.isIncomplete || this.getCoor() == null) return undefined;
        return this.getCoor().$lon();
    },
    set: function(lon) {
        util.assert(! this.isIncomplete,
            "Can''t set lon on an incomplete node");
        util.assert(util.isNumber(lon), "Expected a number, got {0}", lon);
        util.assert(LatLon.isValidLon(lon),
            "Expected a valid lon in the range [-180,180], got {0}", lon);
        var oldlon = this.lon;
        var coor = this.getCoor();
        if (coor == null) coor = new LatLon(0,0);
        coor = new LatLon(coor.$lat(), lon);
        this.setCoor(coor);
        if (oldlon != this.lon && !this.modified) this.modified = true;
    }
};

/**
 * <p>Get the projected east coordinate, or undefined, if the projected east
 * coordinate isn't known.</p>
 *
 * @example
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // set members
 * var n = nb.create();
 * n.east;
 *
 * @memberOf module:josm/mixin/NodeMixin~NodeMixin
 * @name east
 * @readOnly
 * @property {number} east projected east coordinate
 * @summary Get the projected east coordinate.
 * @instance
 */
exports.mixin.east= {
    get: function() {
        if (this.isIncomplete || this.getEastNorth() == null) return undefined;
        return this.getEastNorth().east();
    }
};

/**
 * <p>Get the projected north coordinate, or undefined, if the projected
 * north coordinate isn't known.</p>
 *
 * @example
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // set members
 * var n = nb.create();
 * n.north;
 *
 * @memberOf module:josm/mixin/NodeMixin~NodeMixin
 * @name north
 * @readOnly
 * @property {number} north projected north coordinate
 * @summary Get the projected north coordinate.
 * @instance
 */
exports.mixin.north = {
    get: function() {
        if (this.isIncomplete || this.getEastNorth() == null) return undefined;
        return this.getEastNorth().north();
    }
};

/**
 * <p>Get or set the node position.</p>
 *
 * <dl>
 *  <dt>get</dt>
 *  <dd>replies an instance of
 *   {@class org.openstreetmap.josm.data.coor.LatLon} or
 *   undefined, if the position isn't known.</dd>
 *
 *  <dt>set</dt>
 *  <dd>Assign the position. Either an instance of
 *  {@class org.openstreetmap.josm.data.coor.LatLon}
 *   or an object with the properties <code>{lat: ..., lon: ...}</code></dd>
 * </dl>
 *
 * @example
 * var LatLon = org.openstreetmap.josm.data.coor.LatLon;
 * var nb = require("josm/builder").NodeBuilder;
 *
 * // assign a LatLon as position
 * n.pos = new LatLon(23, 32.33);
 *
 * // assign an object as position
 * n.pos = {lat: 23, lon: 32.33};
 *
 * // get the position
 * n.pos;  // -> a LatLon with the position
 *
 * @memberOf module:josm/mixin/NodeMixin~NodeMixin
 * @name pos
 * @property {org.openstreetmap.josm.data.coor.LatLon} pos position of the node
 * @summary Get or set the node position.
 * @instance
 */
exports.mixin.pos =  {
    get: function() {
        if (this.isIncomplete || this.getCoor() == null) return undefined;
        return this.getCoor();
    },
    set: function(coor) {
        util.assert(util.isSomething(coor),
            "value must not be null or undefined");
        util.assert(!this.isIncomplete,
            "Can''t set a position on an incomplete node");
        var oldpos = this.pos;
        if (coor instanceof LatLon) {
            this.setCoor(coor);
        } else if (typeof coor === "object") {
            var pos = LatLon.make(coor);
            this.setCoor(pos);
        } else {
            util.assert(false, "Unexpected type of value, got {0}", coor);
        }
        if (!util.javaEquals(oldpos, this.pos)
                && !this.modified) this.modified = true;
    }
};

exports.mixin = util.mix(require("josm/mixin/OsmPrimitiveMixin").mixin, exports.mixin);