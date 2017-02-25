"use strict";
describe('The cli', () => {
  let fs;
  let path;
  let mockfs;
  let cli;
  let Project;

  let dir;
  let aureliaProject;
  beforeEach(() => {
    fs = require('../../lib/file-system');
    path = require('path');
    dir = 'workspaces';
    const fsConfig = {};
    fsConfig[dir] = {};

    mockfs = require('mock-fs');
    mockfs(fsConfig);

    cli = new (require('../../lib/cli').CLI)();
    Project = require('../../lib/project').Project;

    aureliaProject = 'aurelia_project';
  });

  describe('The _establishProject() function', () => {
    let project;
    let establish;

    beforeEach(() => {
      project = {};
      spyOn(Project, 'establish').and.returnValue(project);
    });

    it('resolves to nothing', done => {
      cli._establishProject({})
        .then(project => {
          expect(project).not.toBeDefined();
        })
        .catch(fail).then(done);
    });

    it('calls and resolves to Project.establish()', done => {
      fs.mkdirp(path.join(process.cwd(), aureliaProject))
        .then(() => cli._establishProject({
          runningLocally: true
        }))
        .then(project => {
          expect(Project.establish)
            .toHaveBeenCalledWith(cli.ui, path.join(process.cwd()));
          expect(project).toBe(project);
        })
        .catch(fail).then(done);
    });

    it('does not catch Project.establish()', () => {
      pending('Does it even make sense to test this?');
    });

    it(`logs 'No Aurelia project found.'`, done => {
      spyOn(cli.ui, 'log');
      cli._establishProject({
        runningLocally: true
      }).then(() => {
        expect(cli.ui.log).toHaveBeenCalledWith('No Aurelia project found.');
      }).catch(fail).then(done);
    });
  });

  describe('The createHelpCommand() function', () => {
    it('gets the help command', () => {
      spyOn(cli.container, 'get');

      cli.createHelpCommand();
      expect(cli.container.get)
        .toHaveBeenCalledWith(require('../../lib/commands/help/command'));
    });
  });

  describe('The configureContainer() function', () => {
    it('registers the instances', () => {
      const registerInstanceSpy = spyOn(cli.container, 'registerInstance');

      cli.configureContainer();

      expect(registerInstanceSpy.calls.count()).toBe(2);
    });
  });

  describe('The run() function', () => {
    let version;

    beforeEach(() => {
      version = require('../../package.json').version;
    });

    function getVersionSpec(command) {
      return () => {
        beforeEach(() => {
          spyOn(cli.ui, 'log')
            .and.callFake(() => new Promise(resolve => resolve()));
        });

        it('logs the cli version', () => {
          cli.run(command);
          expect(cli.ui.log).toHaveBeenCalledWith(version);
        });

        it('returns an empty promise', done => {
          cli.run(command).then(resolved => {
            expect(resolved).not.toBeDefined();
          }).catch(fail).then(done);
        });
      };
    }

    describe('The --version arg', getVersionSpec('--version'));

    describe('The -v arg', getVersionSpec('-v'));

    it('uses the _establishProject() function', () => {
      spyOn(cli, '_establishProject').and.callThrough();
      
      cli.run();
      expect(cli._establishProject).toHaveBeenCalledWith(cli.options);
    });

    it('registers the project instance', done => {
      const project = {};
      spyOn(cli, '_establishProject').and.returnValue(new Promise(resolve => {
        resolve(project);
      }));
      spyOn(cli.container, 'registerInstance');
      spyOn(cli, 'createCommand').and.returnValue({ execute: () => {} });

      cli.run().then(() => {
        expect(cli.container.registerInstance)
          .toHaveBeenCalledWith(Project, project);
      }).catch(fail).then(done);
    });

    it('creates the command', done => {
      const command = 'run';
      const args = {};
      spyOn(cli, 'createCommand').and.returnValue({ execute: () => {} });

      cli.run(command, args).then(() => {
        expect(cli.createCommand).toHaveBeenCalledWith(command, args);
      }).catch(fail).then(done);
    });

    it('executes the command', done => {
      const command = {
        execute: () => {}
      };
      const args = {};
      spyOn(command, 'execute');
      spyOn(cli, 'createCommand').and.returnValue(command);

      cli.run('run', args).then(() => {
        expect(command.execute).toHaveBeenCalledWith(args);
      }).catch(fail).then(done);
    });
  });
});