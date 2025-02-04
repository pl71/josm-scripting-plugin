/* global Java */
const tu = require('josm/unittest')
const util = require('josm/util')
const test = tu.test

const wb = require('josm/builder').WayBuilder
const nb = require('josm/builder').NodeBuilder
const rb = require('josm/builder').RelationBuilder
const DataSet = Java.type('org.openstreetmap.josm.data.osm.DataSet')
const Relation = Java.type('org.openstreetmap.josm.data.osm.Relation')
const Node = Java.type('org.openstreetmap.josm.data.osm.Node')
const ArrayList = Java.type('java.util.ArrayList')

const suites = []

suites.push(tu.suite("builder method 'member'",
  test('member - with a node, a way or a relation ', function () {
    const node = nb.create()
    let rm = rb.member(node)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === node, 'unexpected member (node)')

    const way = wb.create()
    rm = rb.member(way)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === way, 'unexpected member (way)')

    const relation = rb.create()
    rm = rb.member(relation)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === relation, 'unexpected member (relation)')
  }),

  test('member - with a node - null or undefined not supported ', function () {
    tu.expectAssertionError(function () {
      rb.member(null)
    })

    tu.expectAssertionError(function () {
      rb.member(undefined)
    })
  }),

  test('member - with a node - unexpected value ', function () {
    tu.expectAssertionError(function () {
      rb.member('not supported')
    })
  }),

  test('member - with a role and a node', function () {
    const node = nb.create()
    const rm = rb.member('myrole', node)
    util.assert(rm.getRole() === 'myrole',
      'unexpected role, got {0}', rm.getRole())
    util.assert(rm.getMember() === node, 'unexpected member')
  }),

  test('member - with a role and a node - role can be null or undefined', function () {
    const node = nb.create()
    let rm = rb.member(null, node)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === node, 'unexpected member')

    rm = rb.member(undefined, node)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === node, 'unexpected member')
  }),

  test('member - no arguments', function () {
    tu.expectAssertionError(function () {
      rb.member()
    })
  }),

  test('member - more than two arguments', function () {
    tu.expectAssertionError(function () {
      rb.member('role', nb.create(), 'a string')
    })
  })
))

suites.push(tu.suite('simple local, global and proxy relation ',
  test('local relation - most simple relation', function () {
    const relation = rb.create()
    util.assert(relation instanceof Relation, 'expected a relation')
    util.assert(util.isSomething(relation), 'expected a relation object')
    util.assert(relation.getUniqueId() < 0, 'id should be negative')
  }),

  test('global relation - most simple relation', function () {
    const relation = rb.create(12345)
    util.assert(util.isSomething(relation), 'expected a relation object')
    util.assert(relation.getUniqueId() === 12345, 'id should be 12345')
  }),

  test('proxy relation', function () {
    const relation = rb.createProxy(12345)
    util.assert(util.isSomething(relation), 'expected a relation object')
    util.assert(relation.getUniqueId() === 12345, 'id should be 12345')
    util.assert(relation.isIncomplete, 'should be incomplete')
  })
))

suites.push(tu.suite('using withId(...) to create a relation',
  test('withId(id)', function () {
    const relation = rb.withId(12345).create()
    util.assert(util.isSomething(relation), 'expected a relation object')
    util.assert(relation.getUniqueId() === 12345, 'id should be 12345')
  }),

  test('withId(id,version)', function () {
    const relation = rb.withId(12345, 9).create()
    util.assert(util.isSomething(relation), 'expected a relation object')
    util.assert(relation.getUniqueId() === 12345, 'id should be 12345')
    util.assert(relation.getVersion() === 9, 'version should be 9')
  }),

  test('withId(id) - illegal id', function () {
    tu.expectAssertionError('id must not be null', function () {
      rb.withId(null).create()
    })
    tu.expectAssertionError('id must not be undefined', function () {
      rb.withId(undefined).create()
    })
    tu.expectAssertionError('id must not be 0', function () {
      rb.withId(0).create()
    })
    tu.expectAssertionError('id must not be negative', function () {
      rb.withId(-1).create()
    })
    tu.expectAssertionError('id must not be a string', function () {
      rb.withId('1').create()
    })
  }),

  test('withId(id,version) - illegal version', function () {
    tu.expectAssertionError('version must not be null', function () {
      rb.withId(12345, null).create()
    })
    tu.expectAssertionError('version must not be undefined', function () {
      rb.withId(12345, undefined).create()
    })
    tu.expectAssertionError('version must not be 0', function () {
      rb.withId(12345, 0).create()
    })
    tu.expectAssertionError('version must not be negative', function () {
      rb.withId(12345, -1).create()
    })
    tu.expectAssertionError('version must not be a string', function () {
      rb.withId(12345, '1').create()
    })
  })
))

suites.push(tu.suite('using withTags()',
  test('tage type=route', function () {
    const r = rb.withTags({ type: 'route' }).create()
    util.assert(r.getUniqueId() < 0, 'unexpected id')
    util.assert(r.get('type') === 'route', 'unexpected tag value')
  }),

  test('empty tags should be ok', function () {
    rb.withTags({}).create()
  }),

  test('null tags should be ok', function () {
    rb.withTags(null).create()
  }),

  test('undefined tags should be OK', function () {
    rb.withTags(undefined).create()
  }),

  test('tag key is normalized, tag value is not not normalized', function () {
    const r = rb.withTags({ ' type ': ' route ' }).create()
    util.assert(r.hasKey('type'), "should have normalized tag key 'type'")
    util.assert(r.get('type') === ' route ',
      'tag value should not be normalized, value is <{0}>',
      r.get('type'))
  }),

  test('null tags are ignored', function () {
    const r = rb.withTags({ type: null }).create()
    util.assert(!r.hasTag('type'), 'should not have a null tag')
  }),

  test('undefined tags are ignored', function () {
    const r = rb.withTags({ type: undefined }).create()
    util.assert(!r.hasTag('type'), 'should not have an undefined tag')
  }),

  test('tag values are converted to a string', function () {
    const r = rb.withTags({ type: 2 }).create()
    util.assert(r.get('type') === '2',
      'tag should be converted to a string, value is <{0}>, type is {1}',
      r.get('type'), typeof r.get('type'))
  })
))

suites.push(tu.suite('using withMembers ',
  test('one member - explicit member object', function () {
    const node = nb.create()
    const r = rb.withMembers(rb.member('myrole', node)).create()
    util.assert(r.getMembersCount() === 1, 'unexpected number of members')
    const rm = r.getMember(0)
    util.assert(rm.getRole() === 'myrole', 'unexpected role')
    util.assert(rm.getMember() === node, 'unexpected member node')
  }),

  test('one member - passing in a naked node', function () {
    const node = nb.create()
    const r = rb.withMembers(node).create()
    util.assert(r.getMembersCount() === 1, 'unexpected number of members')
    const rm = r.getMember(0)
    util.assert(rm.getRole() === '', 'unexpected role')
    util.assert(rm.getMember() === node, 'unexpected member node')
  }),

  test('three members - as constargs', function () {
    const n = nb.create()
    const w = wb.create()
    const r = rb.create()
    const relation = rb.withMembers(n, rb.member('role.1', w), r).create()
    util.assert(relation.getMembersCount() === 3,
      'unexpected number of members')
    let rm = relation.getMember(0)
    util.assert(rm.getRole() === '', 'unexpected role for node')
    util.assert(rm.getMember() === n, 'unexpected member node')

    rm = relation.getMember(1)
    util.assert(rm.getRole() === 'role.1', 'unexpected role for way')
    util.assert(rm.getMember() === w, 'unexpected member way')

    rm = relation.getMember(2)
    util.assert(rm.getRole() === '', 'unexpected role for relation')
    util.assert(rm.getMember() === r, 'unexpected member relation')
  }),

  test('three members - as array', function () {
    const n = nb.create()
    const w = wb.create()
    const r = rb.create()
    const relation = rb.withMembers([n, rb.member('role.1', w), r]).create()
    util.assert(relation.getMembersCount() === 3,
      'unexpected number of members')
    let rm = relation.getMember(0)
    util.assert(rm.getRole() === '', 'unexpected role for node')
    util.assert(rm.getMember() === n, 'unexpected member node')

    rm = relation.getMember(1)
    util.assert(rm.getRole() === 'role.1', 'unexpected role for way')
    util.assert(rm.getMember() === w, 'unexpected member way')

    rm = relation.getMember(2)
    util.assert(rm.getRole() === '', 'unexpected role for relation')
    util.assert(rm.getMember() === r, 'unexpected member relation')
  }),

  test('three members - as list', function () {
    const n = nb.create()
    const w = wb.create()
    const r = rb.create()
    const list = new ArrayList()
    list.add(n)
    list.add(rb.member('role.1', w))
    list.add(r)
    const relation = rb.withMembers(list).create()
    util.assert(relation.getMembersCount() === 3,
      'unexpected number of members')
    let rm = relation.getMember(0)
    util.assert(rm.getRole() === '', 'unexpected role for node')
    util.assert(rm.getMember() === n, 'unexpected member node')

    rm = relation.getMember(1)
    util.assert(rm.getRole() === 'role.1', 'unexpected role for way')
    util.assert(rm.getMember() === w, 'unexpected member way')

    rm = relation.getMember(2)
    util.assert(rm.getRole() === '', 'unexpected role for relation')
    util.assert(rm.getMember() === r, 'unexpected member relation')
  }),

  test('null and undefined members should be ignored', function () {
    let r = rb.withMembers(null).create()
    util.assert(r.getMembersCount() === 0,
      '1 - unexpected number of members')

    r = rb.withMembers(undefined).create()
    util.assert(r.getMembersCount() === 0,
      '2 - unexpected number of members')

    r = rb.withMembers([null, undefined]).create()
    util.assert(r.getMembersCount() === 0,
      '3 - unexpected number of members')
  })
))

suites.push(tu.suite('using create(...) with optional arguments',
  test('setting {version: ..}', function () {
    const r = rb.create(12345, { version: 9 })
    util.assert(r instanceof Relation, 'expected a relation')
    util.assert(r.getVersion() === 9,
      'expected version 9, got {0}', r.getVersion())

    tu.expectAssertionError('version must not be null', function () {
      rb.create(12345, { version: null })
    })

    tu.expectAssertionError('version must not be undefined', function () {
      rb.create(12345, { version: undefined })
    })

    tu.expectAssertionError('version must not be 0', function () {
      rb.create(12345, { version: 0 })
    })

    tu.expectAssertionError('version must not be negative', function () {
      rb.create(12345, { version: -1 })
    })

    tu.expectAssertionError('version must not be a string', function () {
      rb.create(12345, { version: '1' })
    })
  }),

  test('setting {tags: ..}', function () {
    let r = rb.create(12345, { tags: { type: 'route' } })
    util.assert(r instanceof Relation, 'expected a relation')
    util.assert(r.get('type') === 'route', 'Tag not set as expected')

    // null and undefined are OK
    r = rb.create(12345, { tags: null })
    r = rb.create(12345, { tags: undefined })

    r = rb.create(12345, { tags: { ' type ': ' route ' } })
    util.assert(r.hasKey('type'), "should have normalized key 'type'")
    util.assert(r.get('type') === ' route ',
      'value should not be normalized, got {0}', r.get('type'))
  }),

  test('setting {members: ..}', function () {
    let r = rb.create(12345, {
      members: [rb.member('role.1', nb.create())]
    })
    util.assert(r instanceof Relation, 'expected a relation')
    util.assert(r.getMembersCount() === 1, '1- unexpected number of members')
    util.assert(r.getMember(0).getRole() === 'role.1', 'unexpected role')
    util.assert(r.getMember(0).getMember() instanceof Node,
      'unexpected type of member object')

    // null and undefined are OK
    r = rb.create(12345, { members: null })
    util.assert(r.getMembersCount() === 0,
      '2 - unexpected number of members')
    r = rb.create(12345, { members: undefined })
    util.assert(r.getMembersCount() === 0,
      '3 - unexpected number of members')
  }),

  test('optional arguments may be null or undefined', function () {
    let r = rb.create(12345, null)
    util.assert(r instanceof Relation, '1 - expected a relation')

    r = rb.create(12345, undefined)
    util.assert(r instanceof Relation, '2 - expected a relation')
  })
))

suites.push(tu.suite('forDataSet test cases',
  test('instance context - create with defined dataset', function () {
    const ds = new DataSet()
    const builder = require('josm/builder')
    let nb = new builder.RelationBuilder()
    nb = nb.forDataSet(ds)
    const n = nb.create()
    util.assert(n.getDataSet() === ds,
      '1 - node should belong to the dataset {0}, actually is {1}',
      ds,
      n.getDataSet()
    )
  }),
  test('static context - create with defined dataset', function () {
    const ds = new DataSet()
    const builder = require('josm/builder')
    const nb = builder.RelationBuilder.forDataSet(ds)
    const n = nb.create()
    util.assert(n.getDataSet() === ds,
      '2 - node should belong to the dataset {0}, actually is {1}',
      ds,
      n.getDataSet()
    )
  })
))

exports.run = function () {
  return suites
    .map(function (a) { return a.run() })
    .reduce(function (a, b) { return a + b })
}
