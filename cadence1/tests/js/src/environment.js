import NodeEnvironment from 'jest-environment-node';

export default class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  skipSuite(object) {
    for (const test of object.parent.tests) {
      if (!test.status && test.mode !== 'skip') {
        test.mode = 'todo';
      }
    }
  }

  checkChildrenForOnly(block) {
    for (const child of block.children ?? []) {
      if (this.checkChildrenForOnly(child)) return true;
    }
    for (const test of block.tests ?? []) {
      if (test.mode === 'only') return true;
    }
    return false;
  }

  async handleTestEvent(event, state) {
    // if (event.name === 'hook_failure' && event.error.FailSuiteError) {
    //  this.skipSuite(event.hook, event.hook.asyncError);
    // }
    if (
      event.name === 'test_start' &&
      event.test.name.startsWith('MUST') &&
      this.checkChildrenForOnly(event.test.parent)
    ) {
      event.test.mode = 'only';
    }
    if (
      event.name === 'test_done' &&
      event.test.errors.some((e) => e[0]?.FailSuiteError)
    ) {
      this.skipSuite(event.test);
    }
  }
}
