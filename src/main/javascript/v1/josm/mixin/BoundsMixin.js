/**
 * This module is auto-loaded by the scripting plugin and mixed into the
 * native java class {@class org.openstreetmap.josm.data.Bounds}.
 *
 * @module josm/mixin/BoundsMixin
 */

var util = require("josm/util");
var LatLon = org.openstreetmap.josm.data.coor.LatLon;
var Bounds = org.openstreetmap.josm.data.Bounds;

/**
 * This mixin is auto-loaded by the scripting plugin and mixed into the
 * native java class {@class org/openstreetmap/josm/data/Bounds}.
 *
 * @mixin BoundsMixin
 * @summary JavaScript mixin for the java class {@class org/openstreetmap/josm/data/Bounds}
 * @forClass org.openstreetmap.josm.data.Bounds
 *
 */
exports.forClass = org.openstreetmap.josm.data.Bounds;
exports.mixin = {};

/**
 * Creates a Bounds from a javascript object.
 *
 * @example
 * var bounds1 = Bounds.make({minlat: 46.9479186, minlon: 7.4619484,
 *         maxlat: 46.9497642, maxlon: 7.4660683});
 *
 * var bounds2 = Bounds.make({
 *    min: {lat: 46.9479186, lon: 7.4619484},
 *    max: {lat: 46.9497642, lon: 7.4660683}
 * });
 *
 * @param {object} obj  a javascript object
 * @return {org.openstreetmap.josm.data.Bounds} the bounds 
 * @memberof module:josm/mixin/BoundsMixin~BoundsMixin
 * @name make
 * @function
 * @static
 */
exports.mixin.make = function(obj) {
    util.assert(util.isSomething(obj), "obj: must not be null or undefined");
    util.assert(typeof obj === "object",
        "obj: expected an object, got {0}", obj);

    function normalizeLat(obj,name) {
        util.assert(util.isDef(obj[name]),
            "{0}: missing mandatory property", name);
        util.assert(util.isNumber(obj[name]),
            "{0}: expected a number, got {1}", name, obj[name]);
        util.assert(LatLon.isValidLat(obj[name]),
            "{0}: expected a valid lat, got {1}", name, obj[name]);
        return obj[name];
    }

    function normalizeLon(obj,name) {
        util.assert(util.isDef(obj[name]),
            "{0}: missing mandatory property", name);
        util.assert(util.isNumber(obj[name]),
            "{0}: expected a number, got {1}", name, obj[name]);
        util.assert(LatLon.isValidLon(obj[name]),
            "{0}: expected a valid lon, got {1}", name, obj[name]);
        return obj[name];
    }

    if (util.isDef(obj.minlat)) {
        var minlat = normalizeLat(obj.minlat);
        var minlon = normalizeLat(obj.minlon);
        var maxlat = normalizeLat(obj.maxlat);
        var maxlon = normalizeLat(obj.maxlon);
        return new Bounds(minlat, minlon, maxlat, maxlon);
    } else if (util.isDef(obj.min)) {
        var min = LatLon.make(obj.min);
        var max = LatLon.make(obj.max);
        return new Bounds(min,max);
    } else {
        util.assert(false,
            "obj: expected an object {min:.., max:..} or "
        + "{minlat:, maxlat:, minlon:, maxlon:}, got {0}", obj);
    }
};
exports.mixin.make.static=true;
