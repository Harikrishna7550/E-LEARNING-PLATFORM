const { expect } = require('chai');
const Course = require('../../models/Course');

describe('Unit: models/Course', () => {
  it('4. requires title, instructorId and instructorName', () => {
    const course = new Course({});
    const err = course.validateSync();
    expect(err).to.exist;
    expect(err.errors).to.have.property('title');
    expect(err.errors).to.have.property('instructorId');
    expect(err.errors).to.have.property('instructorName');
  });

  it('5. toJSON strips internal fields and exposes id', () => {
    const course = new Course({
      title: 'JS Basics',
      instructorId: 'INST-99',
      instructorName: 'Tester',
    });
    const json = course.toJSON();
    expect(json).to.have.property('id');
    expect(json).to.not.have.property('__v');
    expect(json.published).to.equal(false);
    expect(json.isMandatory).to.equal(false);
    expect(json.content).to.be.an('array').that.is.empty;
  });
});
