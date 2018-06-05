// const Bluebird = require('bluebird');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

// global.Promise = Bluebird;
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

global.expect = chai.expect;
process.env.TZ = 'America/Sao_Paulo';
