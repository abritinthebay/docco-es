/* global jest */
const commander = {};

commander.version = jest.fn().mockReturnValue(commander);
commander.usage = jest.fn().mockReturnValue(commander);
commander.option = jest.fn().mockReturnValue(commander);
commander.parse = jest.fn().mockReturnValue(commander);
commander.helpInformation = jest.fn().mockReturnValue(commander);

commander.clearMocks = () => {
	commander.version.mockClear();
	commander.usage.mockClear();
	commander.option.mockClear();
	commander.parse.mockClear();
	commander.helpInformation.mockClear();
};


export default commander;
