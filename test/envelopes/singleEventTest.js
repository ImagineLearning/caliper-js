/*
 * This file is part of IMS Caliper Analytics™ and is licensed to
 * IMS Global Learning Consortium, Inc. (http://www.imsglobal.org)
 * under one or more contributor license agreements.  See the NOTICE
 * file distributed with this work for additional information.
 *
 * IMS Caliper is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * IMS Caliper is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with this program. If not, see http://www.gnu.org/licenses/.
 */

var test = require('tape');
var _ = require('lodash');
var util = require('util');
var jsonCompare = require('../testUtils');

// Request
var requestor = require('../../src/request/httpRequestor');

// Event
var eventFactory = require('../../src/events/eventFactory');
var NavigationEvent = require('../../src/events/navigationEvent');

// Entity
var entityFactory = require('../../src/entities/entityFactory');
var CourseOffering = require('../../src/entities/lis/courseOffering');
var CourseSection = require('../../src/entities/lis/courseSection');
var EpubVolume = require('../../src/entities/resource/ePubVolume');
var Frame = require('../../src/entities/resource/frame');
var Group = require('../../src/entities/lis/group');
var Membership = require('../../src/entities/lis/membership');
var Person = require('../../src/entities/agent/person');
var Session = require('../../src/entities/session/session');
var SoftwareApplication = require('../../src/entities/agent/SoftwareApplication');
var WebPage = require('../../src/entities/resource/webPage');

// Actions
var NavigationActions = require('../../src/actions/navigationActions');

var Role = require('../../src/entities/lis/role');
var Status = require('../../src/entities/lis/status');

test('Create an Envelope containing single NavigationEvent (navigatedTo) and validate properties', function (t) {

  // Plan for N assertions
  t.plan(1);

  const BASE_COURSE_IRI = "https://example.edu/politicalScience/2015/american-revolution-101";
  const BASE_EPUB_IRI = "https://example.com/viewer/book/34843";

  // The Actor for the Caliper Event
  var actorId = "https://example.edu/user/554433";
  var actor = entityFactory().create(Person, actorId, {
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString()
  });

  // Federated Session
  var sessionId = "https://example.edu/lms/federatedSession/123456789";
  var session = entityFactory().create(Session, sessionId, {
    actor: actor,
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    startedAtTime: new Date("2015-09-15T10:15:00Z").toISOString()
  });

  // The Action for the Caliper Event
  var action = NavigationActions.NAVIGATED_TO;

  // The Object being interacted with by the Actor
  var obj = entityFactory().create(EpubVolume, BASE_EPUB_IRI.concat("#epubcfi(/4/3)"), {
    name: "The Glorious Cause: The American Revolution, 1763-1789 (Oxford History of the United States)",
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString(),
    version: "2nd ed."
  });

  // The target object (frame) within the Event Object
  var target = entityFactory().create(Frame, BASE_EPUB_IRI.concat("#epubcfi(/4/3/1)"), {
    name: "Key Figures: George Washington",
    isPartOf: obj,
    index: 1,
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString(),
    version: "2nd ed."
  });

  // Specific to the Navigation Event - the location where the user navigated from
  var referrer = entityFactory().create(WebPage, BASE_COURSE_IRI.concat("/index.html"), {
    name: "American Revolution 101 Landing Page",
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString(),
    version: "1.0"
  });

  // The edApp
  var edAppId = "https://example.com/viewer";
  var edApp = entityFactory().create(SoftwareApplication, edAppId, {
    name: "ePub",
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString(),
    version: "1.2.3"
  });

  // LIS Course Offering
  var course = entityFactory().create(CourseOffering, BASE_COURSE_IRI, {
    name: "Political Science 101: The American Revolution",
    courseNumber: "POL101",
    academicSession: "Fall-2015",
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString()
  });

  // LIS Course Section
  var sectionId = BASE_COURSE_IRI.concat("/section/001");
  var section = entityFactory().create(CourseSection, sectionId, {
    name: "American Revolution 101",
    courseNumber: "POL101",
    academicSession: "Fall-2015",
    subOrganizationOf: course,
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString(),
    dateModified: new Date("2015-09-02T11:30:00Z").toISOString()
  });

  // LIS Group
  var groupId = sectionId.concat("/group/001");
  var group = entityFactory().create(Group, groupId, {
    name: "Discussion Group 001",
    subOrganizationOf: section,
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString()
  });

  // The Actor's Membership
  var membershipId = BASE_COURSE_IRI.concat("/roster/554433");
  var membership = entityFactory().create(Membership, membershipId, {
    name: "American Revolution 101",
    description: "Roster entry",
    member: actor['@id'],
    organization: section['@id'],
    roles: [Role.LEARNER],
    status: Status.ACTIVE,
    dateCreated: new Date("2015-08-01T06:00:00Z").toISOString()
  });

  // Assert that key attributes are the same
  var event = eventFactory().create(NavigationEvent, {
    actor: actor,
    action: action,
    object: obj,
    eventTime: new Date("2015-09-15T10:15:00Z").toISOString(),
    target: target,
    referrer: referrer,
    edApp: edApp,
    group: group,
    membership: membership,
    federatedSession: session['@id']
  });

  // Initialize faux sensor and default options
  var sensor = createFauxSensor("https://example.edu/sensor/001");
  var options = {};

  // Initialize requestor, create envelope and reset sendTime with fixture value (or test will fail).
  requestor.initialize(options);
  var payload = requestor.createEnvelope(sensor, event);
  payload.setSendTime(new Date("2015-09-15T11:05:01.000Z").toISOString());
  
  // Assert that JSON produced is the same
  jsonCompare('caliperEnvelopeEventSingle', payload, t);
});

/**
 * Create a fake sensor object in order to avoid generating a "window is not defined"
 * reference error since we are not running tests in the browser but on the server.
 * @param id
 * @returns {{id: *}}
 */
function createFauxSensor(id) {
    return {id: id};
}